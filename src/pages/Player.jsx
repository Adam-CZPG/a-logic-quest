import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Timer, XCircle, ChevronLeft, ChevronRight, Check, Eye, X, Home as HomeIcon, RotateCcw, LayoutGrid, PencilLine } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { buildMockTest, buildTopicSet, buildDailyPlan, buildMistakesSet, buildDuelSet, taskLabels, dailyKey } from '@/exam/engine';
import { getDuel, saveDuel } from '@/lib/duel';
import { useMe, WEB_ONLY } from '@/pages/Duel';
import { checkAnswer, answerToString, optionLabel, unitSuffix } from '@/exam/checker';
import { recordAnswer, recordFinish, getStats, weakTopics, getRound } from '@/exam/stats';
import { TOPIC_EMOJI } from '@/exam/taxonomy';
import QuestionView, { PenMark } from '@/components/exam/QuestionView';
import Scratchpad from '@/components/exam/Scratchpad';
import { haptic } from '@/lib/native';
import { playWin, playBlock, playClick, playTimeUp } from '@/lib/sfx';
import { cn } from '@/lib/utils';
import { resumeKey, metaFor, loadResume, saveResume, clearResume } from '@/lib/resume';

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

function responseToString(q, resp, lang, t) {
  if (resp === null || resp === undefined || resp === '') return t('res.empty');
  if (q.type === 'choice') return `${'ABCDEF'[resp]}) ${optionLabel(q.options[resp])}`;
  if (q.type === 'tf') return resp.map((v) => (v === true ? t('p.yes') : v === false ? t('p.no') : '–')).join(' · ');
  if (q.type === 'match') return resp.map((v) => (v == null ? '–' : 'ABCDEF'[v])).join(' · ');
  if (q.type === 'number') return `${resp}${unitSuffix(q.unit)}`;
  return String(resp);
}

function truthToString(q, lang, t) {
  if (q.type === 'tf') return q.answer.map((v) => (v ? t('p.yes') : t('p.no'))).join(' · ');
  if (q.type === 'match') return q.answer.map((v) => 'ABCDEF'[v]).join(' · ');
  return answerToString(q, lang);
}

export default function Player() {
  const { kind } = useParams();
  const [params] = useSearchParams();
  const { settings, t } = useSettings();
  const navigate = useNavigate();
  const [nonce, setNonce] = useState(0);

  const set = useMemo(() => (WEB_ONLY && kind !== 'duel' ? null : buildSet(kind, params, settings)), [kind, params.toString(), settings.grade, settings.lang, settings.curriculum, nonce]);
  const mode = params.get('mode') === 'sim' ? 'sim' : 'practice';

  if (!set || !set.questions.length) {
    return (
      <div className="paper min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg">{kind === 'mistakes' ? t('home.noMistakes') : '—'}</p>
        <Link to="/" className="rounded-2xl bg-pen text-on-pen px-5 py-3 font-bold">{t('res.home')}</Link>
      </div>
    );
  }
  return <Session key={`${nonce}-${set.questions[0].id}`} set={set} mode={mode} t={t} settings={settings} onRestart={() => setNonce((n) => n + 1)} onExit={() => navigate(-1)} onDuelDone={(id) => navigate(`/duel/${id}`, { replace: true })} />;
}

function Session({ set, mode, t, settings, onRestart, onExit, onDuelDone }) {
  const { me } = useMe();
  const qs = set.questions;
  const labels = useMemo(() => taskLabels(qs), [qs]);
  const maxPoints = qs.reduce((a, q) => a + (q.points || 1), 0);
  const timed = mode === 'sim' && !!set.minutes;

  // an unfinished run of exactly this set (same tasks, same mode) continues where it stopped
  const rKey = useMemo(() => resumeKey(set, mode, settings.grade), [set, mode, settings.grade]);
  const saved = useMemo(() => loadResume(rKey, qs.length), [rKey, qs.length]);

  const [idx, setIdx] = useState(() => Math.min(saved?.idx ?? 0, qs.length - 1));
  const [answers, setAnswers] = useState(() => saved?.answers ?? qs.map(() => null));
  const [checks, setChecks] = useState(() => saved?.checks ?? qs.map(() => null)); // {correct, score, max, n, first}
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
      meta: metaFor(set, settings.grade, mode), idx, answers, checks, reveal, mistakes,
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
  const locked = !!check && (mode === 'sim' || check.correct || reveal[idx]);
  const points = checks.reduce((a, c) => a + (c ? c.firstScore : 0), 0);

  // clock
  useEffect(() => {
    if (result) return;
    const id = setInterval(() => setElapsed((Date.now() - started.current) / 1000), 500);
    return () => clearInterval(id);
  }, [result]);

  const finish = useCallback(() => {
    const ms = Date.now() - started.current;
    const score = checks.reduce((a, c) => a + (c ? c.firstScore : 0), 0);
    // unchecked but filled answers still count at the end (like handing in the sheet)
    let extra = 0;
    const final = checks.map((c, i) => {
      if (c) return c;
      const r = checkAnswer(qs[i], answers[i]);
      if (!r.empty) {
        recordAnswer(qs[i], r, { grade: settings.grade });
        extra += r.score;
      }
      return { ...r, firstScore: r.score, n: 0, late: true };
    });
    const total = score + extra;
    const answered = final.filter((c) => !c.empty).length;
    finished.current = true;
    clearResume(rKey);
    const badges = recordFinish(set, { score: total, max: maxPoints, ms, grade: settings.grade, mode, answered, count: qs.length });
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
  }, [checks, answers, qs, set, maxPoints, settings.grade, mode, rKey, me, onDuelDone]);

  useEffect(() => {
    if (timed && !result && elapsed >= set.minutes * 60) {
      playTimeUp();
      finish();
    }
  }, [elapsed, timed, result, set.minutes, finish]);

  const go = useCallback((n) => {
    const next = Math.max(0, Math.min(qs.length - 1, n));
    setIdx(next);
    playClick();
  }, [qs.length]);

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
    const res = checkAnswer(q, answers[idx]);
    if (res.empty) {
      playBlock();
      haptic('light');
      return;
    }
    const first = !check;
    if (first) recordAnswer(q, res, { grade: settings.grade, firstTry: true });
    else if (res.correct && q.mistakeId) recordAnswer(q, res, { grade: settings.grade, firstTry: false });
    if (!res.correct) setMistakes((m) => m + 1);
    setChecks((c) => c.map((x, i) => (i === idx
      ? { ...res, n: (x?.n || 0) + 1, firstScore: first ? res.score : x.firstScore, stale: false }
      : x)));
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
            <button onClick={() => setConfirm(true)} className="rounded-xl border-2 border-line px-3 py-1.5 text-sm font-bold hover:border-redpen hover:text-redpen">
              {t('p.finish')}
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
            <button onClick={() => setOverview(true)} aria-label={t('p.overview')} className="ms-auto flex items-center gap-1.5 rounded-full border-2 border-line bg-sheet ps-3 pe-2.5 py-1 font-bold text-ink hover:border-pen">
              {t('p.taskOf', { a: labels[idx], b: qs.length })}
              <LayoutGrid className="w-4 h-4 text-pen" />
            </button>
          </div>
          {/* progress hairline */}
          <div className="mt-2 h-1 rounded-full bg-line overflow-hidden">
            <div className="h-full bg-pen transition-all" style={{ width: `${(answeredCount / qs.length) * 100}%` }} />
          </div>
        </div>
        {resumed && (
          <div className="max-w-3xl mx-auto px-3 pb-2">
            <p className="rounded-xl bg-ok-soft border border-ok/40 px-3 py-1.5 text-sm font-bold text-ok">↺ {t('resume.continued', { a: answers.filter((a) => a !== null && a !== '').length, b: qs.length })}</p>
          </div>
        )}
      </header>

      {/* task */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4" style={{ paddingBottom: draftOpen ? 'calc(46vh + 24px)' : 160 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={idx} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.16 }}>
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
            {mode === 'practice' && check && !check.correct && !check.stale && !reveal[idx] && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-redpen font-bold">
                  {check.total && check.right ? t('p.partial', { r: check.right, t: check.total }) : t('p.wrong')}
                </p>
                <button onClick={() => setReveal((r) => r.map((x, i) => (i === idx ? true : x)))} className="flex items-center gap-1.5 rounded-xl border-2 border-line px-3 py-1.5 text-sm font-bold hover:border-pen">
                  <Eye className="w-4 h-4" />{t('p.showAnswer')}
                </button>
              </div>
            )}
            {mode === 'practice' && check?.correct && <p className="mt-4 text-ok font-bold">{t('p.correct')}</p>}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* answer band – the blue strip from the official app, in fountain-pen ink */}
      {draftOpen && (
        <Scratchpad
          strokes={drafts[idx]}
          onChange={(st) => setDrafts((d) => d.map((x, i) => (i === idx ? st : x)))}
          onClose={() => setDraftOpen(false)}
          t={t}
        />
      )}

      <footer className="fixed bottom-0 inset-x-0 z-30" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="max-w-3xl mx-auto px-3 pb-3">
          <div className="rounded-2xl bg-pen text-on-pen shadow-[0_8px_24px_-8px_hsl(var(--pen)/0.6)] flex items-center gap-2 p-2">
            <button
              onClick={doCheck}
              disabled={!canCheck}
              className="flex items-center gap-2 rounded-xl bg-on-pen/15 hover:bg-on-pen/25 disabled:opacity-40 px-4 py-2.5 font-bold"
            >
              <Check className="w-5 h-5" />{t('p.check')}
            </button>
            <button onClick={() => setDraftOpen((o) => !o)} aria-pressed={draftOpen} aria-label={t('p.draft')}
              className={cn('relative w-11 h-11 rounded-xl grid place-items-center', draftOpen ? 'bg-on-pen text-pen' : 'bg-on-pen/15 hover:bg-on-pen/25')}>
              <PencilLine className="w-5 h-5" />
              {!draftOpen && drafts[idx]?.length > 0 && <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-marker" />}
            </button>
            <span className="text-sm font-bold opacity-90 px-0.5 tabular whitespace-nowrap">{t('p.pts', { n: q.points || 1 })}</span>
            <div className="ms-auto flex items-center gap-1.5">
              <button onClick={() => go(idx - 1)} disabled={idx === 0} aria-label={t('common.back')} className="w-11 h-11 rounded-xl bg-on-pen/15 hover:bg-on-pen/25 disabled:opacity-30 grid place-items-center">
                <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
              </button>
              {idx < qs.length - 1 ? (
                <button onClick={() => go(idx + 1)} className="h-11 rounded-xl bg-on-pen text-pen hover:bg-on-pen/90 px-4 font-bold flex items-center gap-1">
                  {t('p.next')}<ChevronRight className="w-5 h-5 rtl:rotate-180" />
                </button>
              ) : (
                <button onClick={() => setConfirm(true)} className="h-11 rounded-xl bg-marker text-ink px-4 font-bold">
                  {t('p.finish')}
                </button>
              )}
            </div>
          </div>
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
                  const c = checks[i];
                  const filled = answers[i] !== null && answers[i] !== '' && !c;
                  return (
                    <button
                      key={qq.id + i}
                      onClick={() => { go(i); setOverview(false); }}
                      aria-current={i === idx}
                      className={cn(
                        'h-11 rounded-xl border-2 font-bold text-sm tabular',
                        i === idx ? 'bg-ink text-paper border-ink' : 'bg-sheet border-line',
                        i !== idx && c?.correct && 'border-ok bg-ok-soft text-ok',
                        i !== idx && c && !c.correct && 'border-redpen bg-redpen-soft text-redpen',
                        i !== idx && filled && 'border-pen/60 bg-pen-soft',
                      )}
                    >
                      {labels[i]}
                    </button>
                  );
                })}
              </div>
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

function Results({ set, qs, labels, answers, checks, result, maxPoints, t, lang, onRestart }) {
  const [review, setReview] = useState(false);
  const pct = result.score / maxPoints;
  const correct = checks.filter((c) => c?.correct).length;
  const mins = Math.round(result.ms / 60000);
  const verdict = pct >= 0.8 ? t('res.great') : pct >= 0.5 ? t('res.good') : t('res.keep');
  const xp = checks.reduce((a, c, i) => a + (c?.correct && !c.late ? 10 * (qs[i].points || 1) : 0), 0) + (result.counted ? (set.kind === 'mock' ? 50 : set.kind === 'daily' ? 30 : 0) : 0);

  // per-topic breakdown
  const byTopic = {};
  qs.forEach((q, i) => {
    const k = q.topic;
    byTopic[k] = byTopic[k] || { got: 0, max: 0 };
    byTopic[k].max += q.points || 1;
    byTopic[k].got += checks[i]?.firstScore || 0;
  });

  useEffect(() => { haptic(pct >= 0.5 ? 'success' : 'light'); }, []); // eslint-disable-line

  return (
    <div className="paper min-h-screen" style={{ paddingTop: 'var(--safe-top)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <section className="sheet p-6 text-center relative overflow-hidden">
          <p className="text-ink-soft font-bold">{t('res.title')}</p>
          <div className="mt-2 flex items-end justify-center gap-2">
            <span className="font-heading font-extrabold text-7xl tabular text-pen leading-none">{result.score}</span>
            <span className="font-heading font-bold text-2xl text-ink-soft mb-1">/ {maxPoints}</span>
          </div>
          <h2 className="font-heading font-bold text-2xl mt-3"><span className="marker px-1">{verdict}</span></h2>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div><p className="text-ink-soft">{t('res.correct')}</p><p className="font-bold text-lg tabular">{correct}/{qs.length}</p></div>
            <div><p className="text-ink-soft">{t('res.time')}</p><p className="font-bold text-lg tabular">{mins} min</p></div>
            <div><p className="text-ink-soft">XP</p><p className="font-bold text-lg tabular text-ok">{t('res.xp', { xp })}</p></div>
          </div>
          {set.kind === 'mock' && <p className="mt-4 text-sm text-ink-soft">{t('res.pass')}</p>}
        </section>

        {result.roundFinished && (
          <section className="sheet p-4 flex items-center gap-3 border-ok bg-ok-soft">
            <span className="text-3xl" aria-hidden="true">🎉</span>
            <div>
              <p className="font-bold">{t('round.finishedTitle')}</p>
              <p className="text-ink-soft text-sm">{t('round.finishedDesc')}</p>
            </div>
          </section>
        )}
        {!result.counted && (set.kind === 'mock' || set.kind === 'topic') && (
          <p className="text-sm text-ink-soft text-center px-2">{t('round.notCounted')}</p>
        )}

        {result.badges?.length > 0 && (
          <section className="sheet p-4 flex items-center gap-3 border-marker">
            <span className="text-3xl">{result.badges[0].emoji}</span>
            <div>
              <p className="font-bold">{t('res.newBadge')}</p>
              <p className="text-ink-soft">{result.badges.map((b) => t(`b.${b.id}`)).join(', ')}</p>
            </div>
          </section>
        )}

        {Object.keys(byTopic).length > 1 && (
          <section className="sheet p-4 space-y-2.5">
            {Object.entries(byTopic).map(([topic, v]) => (
              <div key={topic}>
                <div className="flex justify-between text-sm gap-3">
                  <span className="truncate">{TOPIC_EMOJI[topic] || '•'} {t(`topic.${topic}`)}</span>
                  <span className="tabular font-bold shrink-0">{v.got}/{v.max}</span>
                </div>
                <div className="h-2 rounded-full bg-line mt-1 overflow-hidden">
                  <div className={cn('h-full rounded-full', v.got / v.max >= 0.7 ? 'bg-ok' : v.got / v.max >= 0.4 ? 'bg-marker' : 'bg-redpen')} style={{ width: `${(v.got / v.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </section>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setReview((r) => !r)} className="rounded-2xl border-2 border-line bg-sheet py-3 font-bold flex flex-col items-center gap-1 text-sm"><Eye className="w-5 h-5" />{t('res.review')}</button>
          <button onClick={onRestart} className="rounded-2xl border-2 border-line bg-sheet py-3 font-bold flex flex-col items-center gap-1 text-sm"><RotateCcw className="w-5 h-5" />{t('res.again')}</button>
          <Link to="/" className="rounded-2xl bg-pen text-on-pen py-3 font-bold flex flex-col items-center gap-1 text-sm"><HomeIcon className="w-5 h-5" />{t('res.home')}</Link>
        </div>

        {review && (
          <section className="space-y-3">
            {qs.map((q, i) => {
              const c = checks[i];
              return (
                <div key={q.id + i} className="sheet p-4">
                  <div className="flex items-start gap-2">
                    <span className="font-heading font-extrabold text-pen">{labels[i]}</span>
                    <p className="flex-1 font-bold leading-snug">{q.text}{q.expr ? ` ${q.expr}` : ''}</p>
                    <PenMark correct={!!c?.correct} className="w-8 h-8" />
                  </div>
                  <p className="mt-2 text-sm"><span className="text-ink-soft">{t('res.yourAnswer')}: </span><span className={c?.correct ? 'text-ok font-bold' : 'text-redpen font-bold'}>{responseToString(q, answers[i], lang, t)}</span></p>
                  {!c?.correct && <p className="text-sm"><span className="text-ink-soft">{t('p.correctAnswer', { a: '' })}</span><span className="font-bold text-ok">{truthToString(q, lang, t)}</span></p>}
                  {q.explain && <p className="mt-1 text-sm text-ink-soft tabular" dir="auto">{q.explain}</p>}
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
