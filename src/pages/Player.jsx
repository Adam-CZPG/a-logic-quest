import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Timer, ListChecks, XCircle, ChevronLeft, ChevronRight, Check, Eye, X, Home as HomeIcon, RotateCcw } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { buildMockTest, buildTopicSet, buildDailyPlan, buildMistakesSet, taskLabels } from '@/exam/engine';
import { checkAnswer, answerToString, optionLabel, unitSuffix } from '@/exam/checker';
import { recordAnswer, recordFinish, getStats, weakTopics } from '@/exam/stats';
import { getPackTests } from '@/exam/packs';
import { hashString } from '@/exam/rng';
import { TOPIC_EMOJI } from '@/exam/taxonomy';
import QuestionView, { PenMark } from '@/components/exam/QuestionView';
import { haptic } from '@/lib/native';
import { playWin, playBlock, playClick, playTimeUp } from '@/lib/sfx';
import { cn } from '@/lib/utils';

function buildSet(kind, params, settings) {
  const { lang, grade, curriculum } = settings;
  const subject = params.get('subject') || 'math';
  if (kind === 'mock') {
    return buildMockTest({ subject, grade, series: Number(params.get('series') || 1), variant: params.get('variant') || 'A', lang, curriculum });
  }
  if (kind === 'topic') {
    return buildTopicSet({ subject, grade, topic: params.get('topic'), lang, curriculum, count: 12 });
  }
  if (kind === 'daily') {
    return buildDailyPlan({ grade, lang, curriculum, weakTopics: weakTopics(getStats(), grade, curriculum) });
  }
  if (kind === 'mistakes') {
    return buildMistakesSet(getStats().mistakes);
  }
  if (kind === 'pack') {
    const test = getPackTests({ subject, grade }).find((x) => x.packId === params.get('pack') && String(x.index) === params.get('i'));
    if (!test) return null;
    const qs = test.questions.map((q, i) => ({
      topic: 'pack', points: 1, ...q, subject: test.subject,
      id: `pack:${test.packId}:${test.index}:${i}:${hashString(q.text)}`,
    }));
    return { kind: 'pack', subject, grade, minutes: test.minutes, questions: qs, title: { text: test.title } };
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

  const set = useMemo(() => buildSet(kind, params, settings), [kind, params.toString(), settings.grade, settings.lang, settings.curriculum, nonce]);
  const mode = params.get('mode') === 'sim' ? 'sim' : 'practice';

  if (!set || !set.questions.length) {
    return (
      <div className="paper min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg">{kind === 'mistakes' ? t('home.noMistakes') : '—'}</p>
        <Link to="/" className="rounded-2xl bg-pen text-on-pen px-5 py-3 font-bold">{t('res.home')}</Link>
      </div>
    );
  }
  return <Session key={`${nonce}-${set.questions[0].id}`} set={set} mode={mode} t={t} settings={settings} onRestart={() => setNonce((n) => n + 1)} onExit={() => navigate(-1)} />;
}

function Session({ set, mode, t, settings, onRestart, onExit }) {
  const qs = set.questions;
  const labels = useMemo(() => taskLabels(qs), [qs]);
  const maxPoints = qs.reduce((a, q) => a + (q.points || 1), 0);
  const timed = mode === 'sim' && !!set.minutes;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(() => qs.map(() => null));
  const [checks, setChecks] = useState(() => qs.map(() => null)); // {correct, score, max, n, first}
  const [reveal, setReveal] = useState(() => qs.map(() => false));
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState(null);
  const started = useRef(Date.now());
  const pillsRef = useRef(null);

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
    const badges = recordFinish(set, { score: total, max: maxPoints, ms, grade: settings.grade, mode, answered, count: qs.length });
    setChecks(final);
    setResult({ score: total, ms, badges, counted: answered * 2 >= qs.length });
    if (total / maxPoints >= 0.8) {
      playWin();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 }, colors: ['#1f3fbf', '#ffd84d', '#1f9d6b', '#e0313b'] });
    }
  }, [checks, answers, qs, set, maxPoints, settings.grade, mode]);

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

  // keep the active pill visible
  useEffect(() => {
    const el = pillsRef.current?.querySelector(`[data-i="${idx}"]`);
    el?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [idx]);

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (result || confirm) return;
      if (e.target?.tagName === 'INPUT' && e.key !== 'Enter') return;
      const rtl = document.documentElement.dir === 'rtl';
      if (e.key === 'ArrowRight') go(idx + (rtl ? -1 : 1));
      if (e.key === 'ArrowLeft') go(idx + (rtl ? 1 : -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, go, result, confirm]);

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

  const titleText = set.title?.text || (set.title?.key ? t(set.title.key, set.title.vars) : '');
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
          <div className="mt-2 flex items-center gap-4 text-sm text-ink-soft tabular">
            {mode === 'sim' || set.kind === 'mock' ? (
              <span className={cn('flex items-center gap-1.5', timed && set.minutes * 60 - elapsed < 300 && 'text-redpen font-bold')}>
                <Timer className="w-4 h-4" />
                {timed ? fmtClock(set.minutes * 60 - elapsed) : fmtClock(elapsed)}
              </span>
            ) : (
              <span className="flex items-center gap-1.5"><XCircle className="w-4 h-4" />{t('p.mistakes', { n: mistakes })}</span>
            )}
            <span className="flex items-center gap-1.5"><ListChecks className="w-4 h-4" />{t('p.tasks', { n: qs.length })}</span>
            <span className="ms-auto font-bold text-ink">{t('p.points', { a: points, b: maxPoints })}</span>
          </div>
          {/* progress hairline */}
          <div className="mt-2 h-1 rounded-full bg-line overflow-hidden">
            <div className="h-full bg-pen transition-all" style={{ width: `${(answeredCount / qs.length) * 100}%` }} />
          </div>
          {/* task pills */}
          <div ref={pillsRef} className="mt-2 flex gap-2 overflow-x-auto no-scrollbar py-1" role="tablist">
            {qs.map((qq, i) => {
              const c = checks[i];
              const filled = answers[i] !== null && answers[i] !== '' && !c;
              return (
                <button
                  key={qq.id + i}
                  data-i={i}
                  role="tab"
                  aria-selected={i === idx}
                  onClick={() => go(i)}
                  className={cn(
                    'shrink-0 min-w-[3rem] h-10 px-3 rounded-full border-2 font-bold text-sm tabular transition-colors',
                    i === idx ? 'bg-ink text-paper border-ink' : 'bg-sheet border-line',
                    i !== idx && c?.correct && 'border-ok text-ok',
                    i !== idx && c && !c.correct && 'border-redpen text-redpen',
                    i !== idx && filled && 'border-pen/60',
                  )}
                >
                  {labels[i]}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* task */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-5 pb-40">
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
      <footer className="fixed bottom-0 inset-x-0 z-20" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="max-w-3xl mx-auto px-3 pb-3">
          <div className="rounded-2xl bg-pen text-on-pen shadow-[0_8px_24px_-8px_hsl(var(--pen)/0.6)] flex items-center gap-2 p-2">
            <button
              onClick={doCheck}
              disabled={!canCheck}
              className="flex items-center gap-2 rounded-xl bg-on-pen/15 hover:bg-on-pen/25 disabled:opacity-40 px-4 py-2.5 font-bold"
            >
              <Check className="w-5 h-5" />{t('p.check')}
            </button>
            <span className="text-sm font-bold opacity-90 px-1 tabular whitespace-nowrap">{t('p.pts', { n: q.points || 1 })}</span>
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
