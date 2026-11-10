import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Timer, XCircle, ChevronLeft, Eye, X, RotateCcw, LayoutGrid, PencilLine, Flag, ArrowRight, CheckCheck } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { buildMockTest, buildTopicSet, buildDailyPlan, buildMistakesSet, buildDuelSet, taskLabels, dailyKey } from '@/exam/engine';
import { getDuel, saveDuel } from '@/lib/duel';
import { syncXp } from '@/lib/league';
import { useMe, WEB_ONLY } from '@/pages/Duel';
import { partial, pointsOf, gradeTask, finalize } from '@/exam/scoring';
import { recordAnswer, recordFinish, getStats, weakTopics, getRound } from '@/exam/stats';
import QuestionView from '@/components/exam/QuestionView';
import Results from '@/components/exam/Results';
import Scratchpad from '@/components/exam/Scratchpad';
import { haptic } from '@/lib/native';
import { playWin, playBlock, playClick, playTimeUp } from '@/lib/sfx';
import { cn } from '@/lib/utils';
import { resumeKey, metaFor, loadResume, saveResume, clearResume } from '@/lib/resume';
import { saveLast, loadLast } from '@/lib/lastrun';

const DAILY_KEY = 'lq_daily_plan_v1';
function dailyWeak(grade, curriculum) {
  const day = dailyKey();
  const id = `${day}:${grade}:${curriculum}`;
  try {
    const c = JSON.parse(localStorage.getItem(DAILY_KEY) || 'null');
    if (c && c.id === id && c.weak) return c.weak;
  } catch {}
  const weak = weakTopics(getStats(), grade, curriculum);
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify({ id, weak }));
  } catch {}
  return weak;
}

function buildSet(kind, params, settings) {
  const { lang, grade, curriculum } = settings;
  if (kind === 'duel') {
    // the duel's own subject, grade and country – so both players get the very same tasks
    const d = getDuel(params.get('id'));
    if (!d) return null;
    return { ...buildDuelSet({ subject: d.subject, grade: d.grade, curriculum: d.curriculum, lang, seed: d.seed }), duelId: d.id };
  }
  const subject = params.get('subject') || 'math';
  const cycle = getRound(getStats(), subject, grade).cycle;
  if (kind === 'mock') {
    // number 1…40; old links with series+variant still work
    let number = Number(params.get('n'));
    if (!number && params.get('series')) number = (Number(params.get('series')) - 1) * 4 + Math.max(0, 'ABCD'.indexOf(params.get('variant') || 'A')) + 1;
    return buildMockTest({ subject, grade, number: Math.min(Math.max(number || 1, 1), 40), lang, curriculum, cycle });
  }
  if (kind === 'topic') {
    const variant = Number(params.get('v')) || null;
    return buildTopicSet({ subject, grade, topic: params.get('topic'), lang, curriculum, count: 12, variant, cycle });
  }
  if (kind === 'daily') {
    // the plan is fixed for the whole day (weak topics taken in the morning), so a break never changes it
    return buildDailyPlan({ grade, lang, curriculum, weakTopics: dailyWeak(grade, curriculum) });
  }
  if (kind === 'mistakes') {
    return buildMistakesSet(getStats().mistakes);
  }
  return null;
}

const fmtClock = (sec) => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

export default function Player() {
  const { kind } = useParams();
  const [params] = useSearchParams();
  const { settings, t } = useSettings();
  const navigate = useNavigate();
  const [nonce, setNonce] = useState(0);

  const set = useMemo(() => (WEB_ONLY && kind !== 'duel' ? null : buildSet(kind, params, settings)), [kind, params.toString(), settings.grade, settings.lang, settings.curriculum, nonce]);
  const mode = params.get('mode') === 'sim' ? 'sim' : 'practice';
  // ?fix=1 reopens the last finished attempt so only the red / skipped tasks get fixed ("again" starts fresh)
  const fix = params.get('fix') === '1' && nonce === 0;

  if (!set || !set.questions.length) {
    return (
      <div className="paper min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg">{kind === 'mistakes' ? t('home.noMistakes') : '—'}</p>
        <Link to="/" className="rounded-2xl bg-pen text-on-pen px-5 py-3 font-bold">{t('res.home')}</Link>
      </div>
    );
  }
  return <Session key={`${nonce}-${params.get('r') || ''}-${set.questions[0].id}`} set={set} mode={fix ? 'practice' : mode} fix={fix} t={t} settings={settings} onRestart={() => setNonce((n) => n + 1)} onExit={() => navigate(-1)} onDuelDone={(id) => navigate(`/duel/${id}`, { replace: true })} />;
}

function Session({ set, mode, fix: fixAsked, t, settings, onRestart, onExit, onDuelDone }) {
  const { me } = useMe();
  const qs = set.questions;
  const labels = useMemo(() => taskLabels(qs), [qs]);
  const maxPoints = qs.reduce((a, q) => a + (q.points || 1), 0);
  const timed = mode === 'sim' && !!set.minutes;

  // an unfinished run of exactly this set (same tasks, same mode) continues where it stopped
  const rKey = useMemo(() => resumeKey(set, mode, settings.grade), [set, mode, settings.grade]);
  const saved = useMemo(() => loadResume(rKey, qs.length), [rKey, qs.length]);
  // fixing mode: start from the last finished attempt (unless a fixing run is already being continued)
  const last = useMemo(() => (fixAsked && !saved ? loadLast(set, settings.grade) : null), [fixAsked, saved, set, settings.grade]);
  const fixing = !!(saved?.fix || last);
  const [skipped] = useState(() => saved?.skipped ?? (last ? last.st.map((x) => x === 'skip') : qs.map(() => false)));

  const [idx, setIdx] = useState(() => {
    if (saved) return Math.min(saved.idx ?? 0, qs.length - 1);
    const firstOpen = last ? last.st.findIndex((x) => x !== 'ok') : -1;
    return Math.max(firstOpen, 0);
  });
  const [answers, setAnswers] = useState(() => saved?.answers ?? (last ? last.answers.map((a, i) => (last.st[i] === 'skip' ? null : a)) : qs.map(() => null)));
  const [checks, setChecks] = useState(() => saved?.checks ?? last?.checks ?? qs.map(() => null)); // {correct, score, max, n, first}
  const [reveal, setReveal] = useState(() => saved?.reveal ?? qs.map(() => false));
  const [mistakes, setMistakes] = useState(() => saved?.mistakes ?? 0);
  const [elapsed, setElapsed] = useState(() => (saved?.ms ?? 0) / 1000);
  const [resumed, setResumed] = useState(!!saved);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState(null);
  const [overview, setOverview] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [drafts, setDrafts] = useState(() => qs.map(() => []));
  // time spent before a break counts, the break itself does not
  const started = useRef(Date.now() - (saved?.ms ?? 0));

  // keep the run on the device after every change (and every few seconds for the clock)
  const finished = useRef(false);
  useEffect(() => {
    if (finished.current) return;
    const touched = answers.some((a) => a !== null && a !== '') || checks.some(Boolean);
    if (!touched) return;
    saveResume(rKey, {
      meta: metaFor(set, settings.grade, mode), idx, answers, checks, reveal, mistakes, fix: fixing, skipped, left,
      ms: Date.now() - started.current, answered: answers.filter((a) => a !== null && a !== '').length,
    });
  }, [rKey, set, settings.grade, mode, idx, answers, checks, reveal, mistakes, Math.floor(elapsed / 5)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!resumed) return;
    const id = setTimeout(() => setResumed(false), 3500);
    return () => clearTimeout(id);
  }, [resumed]);

  const q = qs[idx];
  const check = checks[idx];
  // a wrong answer is never locked: the child can come back (red tile) and fix it in both modes;
  // points still count only the first try, so fixing helps learning, not the score
  const locked = !!check && (check.correct || reveal[idx]);
  const points = pointsOf(checks);

  // clock
  useEffect(() => {
    if (result) return;
    const id = setInterval(() => setElapsed((Date.now() - started.current) / 1000), 500);
    return () => clearInterval(id);
  }, [result]);

  const finish = useCallback(() => {
    const ms = Date.now() - started.current;
    // unchecked but filled answers still count at the end (like handing in the sheet);
    // when fixing, they are marked but never add points
    const { final, total, answered, graded } = finalize(qs, answers, checks, { fixing });
    if (!fixing) graded.forEach(({ i, res }) => recordAnswer(qs[i], res, { grade: settings.grade }));
    finished.current = true;
    clearResume(rKey);
    if (fixing) {
      // fixing does not change the score or XP, it only turns red / orange tasks green
      saveLast(set, settings.grade, { answers, checks: final, score: total, max: maxPoints });
      setChecks(final);
      setResult({ score: total, ms, badges: [], counted: true, fix: true });
      return;
    }
    if (!set.duelId) saveLast(set, settings.grade, { answers, checks: final, score: total, max: maxPoints });
    const badges = recordFinish(set, { score: total, max: maxPoints, ms, grade: settings.grade, mode, answered, count: qs.length });
    // league: send the new XP in the background (does nothing if the child did not join)
    syncXp().catch(() => {});
    if (set.duelId) {
      // a duel ends on the VS screen, not on the normal results
      const d = getDuel(set.duelId);
      if (d) {
        const res = me(total, Math.max(ms, 1000));
        saveDuel(d.role === 'a' ? { ...d, a: res } : { ...d, b: res });
        onDuelDone(d.id);
        return;
      }
    }
    setChecks(final);
    setResult({ score: total, ms, badges, counted: answered * 2 >= qs.length, roundFinished: !!set.roundFinished });
    if (total / maxPoints >= 0.8) {
      playWin();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 }, colors: ['#1f3fbf', '#ffd84d', '#1f9d6b', '#e0313b'] });
    }
  }, [checks, answers, qs, set, maxPoints, settings.grade, mode, rKey, me, onDuelDone, fixing]);

  useEffect(() => {
    if (timed && !result && elapsed >= set.minutes * 60) {
      playTimeUp();
      finish();
    }
  }, [elapsed, timed, result, set.minutes, finish]);

  // grade task i (quietly); the first grading is what counts for points, later ones are fixes
  function grade(i) {
    const g = gradeTask(qs[i], answers[i], checks[i], { fixing });
    if (!g) return null;
    const { res, check, first } = g;
    if (res.empty) return res;
    if (first) recordAnswer(qs[i], res, { grade: settings.grade, firstTry: true });
    else if (res.correct && qs[i].mistakeId) recordAnswer(qs[i], res, { grade: settings.grade, firstTry: false });
    if (!res.correct) setMistakes((m) => m + 1);
    setChecks((cs) => cs.map((x, k) => (k === i ? check : x)));
    return res;
  }

  // leaving a task hands its answer in, so the overview always shows right / wrong / skipped
  const [left, setLeft] = useState(() => saved?.left ?? qs.map(() => false));
  function leave() {
    // a task with several parts (ANO/NE rows, pairs) is only handed in once every part is filled:
    // swiping away from a half-done task must not cost its first-try points
    if (!partial(qs[idx], answers[idx])) grade(idx);
    if (!left[idx]) setLeft((l) => l.map((x, k) => (k === idx ? true : x)));
  }
  function go(n) {
    const next = Math.max(0, Math.min(qs.length - 1, n));
    if (next !== idx) leave();
    setIdx(next);
    playClick();
  }
  function openOverview() {
    leave();
    setOverview(true);
  }

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (result || confirm || overview) return;
      if (e.target?.tagName === 'INPUT' && e.key !== 'Enter') return;
      const rtl = document.documentElement.dir === 'rtl';
      if (e.key === 'ArrowRight') go(idx + (rtl ? -1 : 1));
      if (e.key === 'ArrowLeft') go(idx + (rtl ? 1 : -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, go, result, confirm, overview]);

  // swipe
  const touch = useRef(null);
  const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      const rtl = document.documentElement.dir === 'rtl';
      go(idx + ((dx < 0) !== rtl ? 1 : -1));
    }
  };

  function setAnswer(v) {
    if (locked) return;
    setAnswers((a) => a.map((x, i) => (i === idx ? v : x)));
    if (check && !check.correct) {
      // editing after a wrong check clears the mark so the next check counts as a retry
      setChecks((c) => c.map((x, i) => (i === idx ? { ...x, stale: true } : x)));
    }
  }

  function doCheck() {
    if (locked) return;
    const res = grade(idx);
    if (!res) return;
    if (res.empty) {
      playBlock();
      haptic('light');
      return;
    }
    if (res.correct) {
      haptic('success');
      playWin();
    } else {
      haptic('error');
      playBlock();
    }
  }

  const answeredCount = checks.filter(Boolean).length;
  const canCheck = !locked;
  // ok = right, bad = checked wrong, fixing = wrong but already being changed, filled = answered not checked
  const statusOf = (i) => {
    const c = checks[i];
    if (c?.correct) return 'ok';
    if (c && c.stale) return 'fixing';
    if (c) return 'bad';
    if (answers[i] !== null && answers[i] !== '') return 'filled';
    // passed over without an answer (or left empty last time) = skipped
    return skipped[i] || (left[i] && i !== idx) ? 'skip' : 'empty';
  };
  const wrongIdx = qs.map((_, i) => i).filter((i) => ['bad', 'fixing', 'skip'].includes(statusOf(i)));
  const nextWrong = () => wrongIdx.find((i) => i > idx) ?? wrongIdx.find((i) => i !== idx) ?? wrongIdx[0];

  if (result) {
    return <Results set={set} qs={qs} labels={labels} answers={answers} checks={checks} result={result} maxPoints={maxPoints} t={t} lang={settings.lang} onRestart={onRestart} />;
  }

  // title vars may themselves be keys (e.g. a topic name)
  const titleVars = Object.fromEntries(Object.entries(set.title?.vars || {}).map(([k, v]) => [k, typeof v === 'string' && v.startsWith('topic.') ? t(v) : v]));
  const titleText = set.title?.text || (set.title?.key ? t(set.title.key, titleVars) : '');
  const subjectName = set.subject ? t(`subject.${set.subject}`) : '';

  return (
    <div className="paper min-h-screen flex flex-col" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* header */}
      <header className="sticky top-0 z-20 bg-paper/95 backdrop-blur border-b-2 border-line" style={{ paddingTop: 'var(--safe-top)' }}>
        <div className="max-w-3xl mx-auto px-3 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <button onClick={onExit} aria-label={t('common.back')} className="w-10 h-10 rounded-xl grid place-items-center hover:bg-pen-soft">
              <X className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-soft truncate">{subjectName}{set.subject && settings.grade ? ` · ${t('grade.n', { g: settings.grade })}` : ''}</p>
              <h1 className="font-heading font-bold text-[17px] leading-tight truncate">{titleText}</h1>
            </div>
            <button onClick={() => setConfirm(true)} className="flex items-center gap-1.5 rounded-full border-2 border-[#1B2340] bg-sheet px-3 py-1.5 text-sm font-bold text-[#1B2340] dark:text-ink dark:border-ink hover:bg-marker/40">
              <Flag className="w-4 h-4" />{t('p.finish')}
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-sm text-ink-soft tabular">
            {mode === 'sim' || set.kind === 'mock' ? (
              <span className={cn('flex items-center gap-1.5', timed && set.minutes * 60 - elapsed < 300 && 'text-redpen font-bold')}>
                <Timer className="w-4 h-4" />
                {timed ? fmtClock(set.minutes * 60 - elapsed) : fmtClock(elapsed)}
              </span>
            ) : (
              <span className="flex items-center gap-1.5"><XCircle className="w-4 h-4" />{t('p.mistakes', { n: mistakes })}</span>
            )}
            <span className="font-bold text-ink">{t('p.points', { a: points, b: maxPoints })}</span>
            {/* one compact button instead of a long scrolling strip of task numbers */}
            <button onClick={openOverview} aria-label={t('p.overview')} className="relative ms-auto flex items-center gap-1.5 rounded-full border-2 border-line bg-sheet ps-3 pe-2.5 py-1 font-bold text-ink hover:border-pen">
              {t('p.taskOf', { a: labels[idx], b: qs.length })}
              <LayoutGrid className="w-4 h-4 text-pen" />
              {wrongIdx.length > 0 && (
                <span className="absolute -top-2 -end-1.5 min-w-5 h-5 px-1 rounded-full bg-redpen text-white text-[11px] font-extrabold grid place-items-center">{wrongIdx.length}</span>
              )}
            </button>
          </div>
          {/* progress hairline */}
          <div className="mt-2 h-1 rounded-full bg-line overflow-hidden">
            <div className="h-full bg-pen transition-all" style={{ width: `${(answeredCount / qs.length) * 100}%` }} />
          </div>
        </div>
        {fixing && (
          <div className="max-w-3xl mx-auto px-3 pb-2">
            <button onClick={openOverview} className="w-full text-start rounded-xl bg-redpen-soft border border-redpen/40 px-3 py-1.5 text-sm font-bold text-redpen">
              🛠️ {wrongIdx.length ? t('p.fixBanner', { n: wrongIdx.length }) : t('p.allFixed')}
            </button>
          </div>
        )}
        {resumed && !fixing && (
          <div className="max-w-3xl mx-auto px-3 pb-2">
            <p className="rounded-xl bg-ok-soft border border-ok/40 px-3 py-1.5 text-sm font-bold text-ok">↺ {t('resume.continued', { a: answers.filter((a) => a !== null && a !== '').length, b: qs.length })}</p>
          </div>
        )}
      </header>

      {/* task */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4" style={{ paddingBottom: 160 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={idx} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.16 }}>
            <div className="mb-2 flex justify-end">
              <span className="rounded-full bg-marker/40 px-2.5 py-0.5 text-xs font-extrabold tabular">⭐ {t('p.pts', { n: q.points || 1 })}</span>
            </div>
            <QuestionView
              q={q}
              label={labels[idx]}
              value={answers[idx]}
              onChange={setAnswer}
              locked={locked}
              feedback={check && !check.stale ? check : null}
              reveal={reveal[idx] || (mode === 'practice' && check?.correct)}
              lang={settings.lang}
              t={t}
              onSubmit={doCheck}
            />
            {check && !check.correct && !check.stale && !reveal[idx] && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-redpen font-bold">
                  {check.total && check.right ? t('p.partial', { r: check.right, t: check.total }) : t('p.wrong')}
                </p>
                {mode === 'practice' && (
                  <button onClick={() => setReveal((r) => r.map((x, i) => (i === idx ? true : x)))} className="flex items-center gap-1.5 rounded-xl border-2 border-line px-3 py-1.5 text-sm font-bold hover:border-pen">
                    <Eye className="w-4 h-4" />{t('p.showAnswer')}
                  </button>
                )}
              </div>
            )}
            {check?.correct && !check.stale && <p className="mt-4 text-ok font-bold">{t('p.correct')}</p>}
            {/* while fixing: jump straight to the next red task */}
            {wrongIdx.some((i) => i !== idx) && check && (check.correct || reveal[idx]) && (
              <button onClick={() => go(nextWrong())} className="mt-3 flex items-center gap-1.5 rounded-xl border-2 border-redpen/60 bg-redpen-soft px-3 py-1.5 text-sm font-bold text-redpen">
                <RotateCcw className="w-4 h-4" />{t('p.nextMistake')}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {draftOpen && (
        <Scratchpad
          q={q}
          strokes={drafts[idx]}
          onChange={(st) => setDrafts((d) => d.map((x, i) => (i === idx ? st : x)))}
          onClose={() => setDraftOpen(false)}
          t={t}
        />
      )}

      {/* TryFixPass's own control row: sticker buttons on the notebook page */}
      <footer className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-paper via-paper/95 to-paper/0 pt-6" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="max-w-3xl mx-auto px-3 pb-3 flex items-center gap-2">
          <button onClick={() => go(idx - 1)} disabled={idx === 0} aria-label={t('common.back')}
            className="w-12 h-12 shrink-0 rounded-full border-2 border-line bg-sheet grid place-items-center disabled:opacity-30 hover:border-pen">
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          <button onClick={() => setDraftOpen((o) => !o)} aria-pressed={draftOpen} aria-label={t('p.draft')}
            className={cn('relative w-12 h-12 shrink-0 rounded-full border-2 grid place-items-center', draftOpen ? 'border-pen bg-pen text-on-pen' : 'border-line bg-sheet hover:border-pen')}>
            <PencilLine className="w-5 h-5" />
            {!draftOpen && drafts[idx]?.length > 0 && <span className="absolute top-1 end-1 w-2.5 h-2.5 rounded-full bg-marker border-2 border-sheet" />}
          </button>
          {check?.correct && !check.stale && idx < qs.length - 1 ? (
            // after a right answer the big button moves on
            <button onClick={() => go(idx + 1)}
              className="flex-1 h-12 rounded-2xl border-[3px] border-[#1B2340] bg-[#BDF0CF] text-[#1B2340] font-heading font-extrabold text-[17px] flex items-center justify-center gap-2 shadow-[3px_3px_0_0_rgba(27,35,64,0.85)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              {t('p.next')}<ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </button>
          ) : (
            <button onClick={doCheck} disabled={!canCheck}
              className="flex-1 h-12 rounded-2xl border-[3px] border-[#1B2340] bg-marker text-[#1B2340] font-heading font-extrabold text-[17px] flex items-center justify-center gap-2 shadow-[3px_3px_0_0_rgba(27,35,64,0.85)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-45 disabled:shadow-none">
              <CheckCheck className="w-5 h-5" />{t('p.check')}
            </button>
          )}
          {idx < qs.length - 1 ? (
            <button onClick={() => go(idx + 1)} aria-label={t('p.next')}
              className="w-12 h-12 shrink-0 rounded-full bg-[#1B2340] text-white grid place-items-center hover:opacity-90 dark:bg-ink dark:text-paper">
              <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </button>
          ) : (
            <button onClick={() => setConfirm(true)} aria-label={t('p.finish')}
              className="h-12 shrink-0 rounded-full bg-[#1B2340] text-white px-4 font-bold flex items-center gap-1.5 dark:bg-ink dark:text-paper">
              <Flag className="w-4 h-4" />{t('p.finish')}
            </button>
          )}
        </div>
      </footer>

      <AnimatePresence>
        {overview && (
          <motion.div className="fixed inset-0 z-40 bg-ink/40 grid place-items-end sm:place-items-center p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOverview(false)}>
            <motion.div role="dialog" aria-modal="true" aria-label={t('p.overview')} className="sheet w-full max-w-md p-4 max-h-[75vh] overflow-y-auto" initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30 }} onClick={(e) => e.stopPropagation()} style={{ marginBottom: 'var(--safe-bottom)' }}>
              <div className="flex items-center mb-3">
                <h2 className="font-heading font-bold text-lg flex-1">{t('p.overview')}</h2>
                <button onClick={() => setOverview(false)} aria-label={t('common.close')} className="w-9 h-9 rounded-xl grid place-items-center hover:bg-pen-soft"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {qs.map((qq, i) => {
                  const st = statusOf(i);
                  return (
                    <button
                      key={qq.id + i}
                      onClick={() => { go(i); setOverview(false); }}
                      aria-current={i === idx}
                      aria-label={`${labels[i]} – ${t({ ok: 'p.lgOk', bad: 'p.lgBad', fixing: 'p.lgFixing', filled: 'p.lgFilled', skip: 'p.lgSkip', empty: 'p.lgEmpty' }[st])}`}
                      className={cn(
                        'relative h-11 rounded-xl border-2 font-bold text-sm tabular transition-transform active:scale-95',
                        st === 'ok' && 'border-ok bg-ok text-white',
                        st === 'bad' && 'border-redpen bg-redpen text-white',
                        st === 'fixing' && 'border-redpen border-dashed bg-redpen-soft text-redpen',
                        st === 'filled' && 'border-pen bg-pen-soft text-ink',
                        st === 'skip' && 'border-marker border-dashed bg-marker/25 text-ink',
                        st === 'empty' && 'border-line bg-sheet text-ink',
                        // the current task keeps its colour and gets a ring instead
                        i === idx && 'ring-[3px] ring-offset-2 ring-offset-sheet ring-marker',
                      )}
                    >
                      {labels[i]}
                      {st === 'ok' && <span className="absolute -top-1.5 -end-1.5 w-4 h-4 rounded-full bg-sheet text-ok text-[10px] leading-4 border border-ok">✓</span>}
                      {st === 'bad' && <span className="absolute -top-1.5 -end-1.5 w-4 h-4 rounded-full bg-sheet text-redpen text-[10px] leading-4 border border-redpen">✗</span>}
                    </button>
                  );
                })}
              </div>
              {/* legend */}
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
                <span className="flex items-center gap-1"><i className="w-3 h-3 rounded bg-ok" />{t('p.lgOk')} {checks.filter((c) => c?.correct).length}</span>
                <span className="flex items-center gap-1"><i className="w-3 h-3 rounded bg-redpen" />{t('p.lgBad')} {qs.filter((_, i) => ['bad', 'fixing'].includes(statusOf(i))).length}</span>
                {qs.some((_, i) => statusOf(i) === 'skip') && <span className="flex items-center gap-1"><i className="w-3 h-3 rounded bg-marker/40 border border-dashed border-marker" />{t('p.lgSkip')} {qs.filter((_, i) => statusOf(i) === 'skip').length}</span>}
                <span className="flex items-center gap-1"><i className="w-3 h-3 rounded bg-sheet border border-line" />{t('p.lgEmpty')}</span>
              </div>
              {wrongIdx.length > 0 ? (
                <>
                  <button onClick={() => { go(nextWrong()); setOverview(false); }}
                    className="mt-3 w-full h-12 rounded-2xl border-[3px] border-[#1B2340] bg-redpen text-white font-heading font-extrabold flex items-center justify-center gap-2 shadow-[3px_3px_0_0_rgba(27,35,64,0.85)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                    <RotateCcw className="w-5 h-5" />{t('p.fixMistakes', { n: wrongIdx.length })}
                  </button>
                  <p className="mt-1.5 text-center text-xs text-ink-soft">{t('p.tapRed')}</p>
                </>
              ) : checks.some(Boolean) && checks.filter((c) => c?.correct).length === checks.filter(Boolean).length ? (
                <p className="mt-3 text-center text-sm font-bold text-ok">{t('p.allFixed')}</p>
              ) : null}
            </motion.div>
          </motion.div>
        )}
        {confirm && (
          <motion.div className="fixed inset-0 z-40 bg-ink/40 grid place-items-end sm:place-items-center p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirm(false)}>
            <motion.div role="dialog" aria-modal="true" className="sheet w-full max-w-sm p-5" initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30 }} onClick={(e) => e.stopPropagation()}>
              <p className="font-bold text-lg mb-4">{t('p.confirmFinish')}</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirm(false)} className="rounded-xl border-2 border-line px-4 py-2.5 font-bold">{t('common.cancel')}</button>
                <button onClick={() => { setConfirm(false); finish(); }} className="rounded-xl bg-pen text-on-pen px-4 py-2.5 font-bold">{t('p.finish')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
