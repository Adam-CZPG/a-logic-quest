import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Timer, Dumbbell, Check, CircleHelp, RotateCcw, X, Lock } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { getStats, topicAccuracy, getRound, startNewRound } from '@/exam/stats';
import { subjectsFor, SUBJECTS, MOCK_LEVELS, MOCK_PER_LEVEL, MOCK_COUNT, TOPIC_VARIANTS, topicsFor, TOPIC_EMOJI, blueprintFor, subjectLevel } from '@/exam/taxonomy';
import { cn } from '@/lib/utils';
import { listResume } from '@/lib/resume';
import { leftToFix } from '@/lib/lastrun';
import { usePremium, isFree } from '@/lib/premium';
import PaywallSheet from '@/components/PaywallSheet';

const LEVEL_EMOJI = ['🌱', '🚲', '🚀', '🏔️'];

export default function Subject() {
  const { subject } = useParams();
  const [params, setParams] = useSearchParams();
  const { settings, t } = useSettings();
  const navigate = useNavigate();
  const [pick, setPick] = useState(null); // { href, title, timed }
  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [, bump] = useState(0);
  const [paywall, setPaywall] = useState(false);
  const premium = usePremium();
  const locked = (kind, opts) => !premium && !isFree(kind, opts);
  const { grade, curriculum } = settings;
  const isCz = curriculum === 'cz';
  const tab = params.get('tab') === 'topics' ? 'topics' : 'tests';
  const setTab = (v) => setParams({ tab: v }, { replace: true });

  if (!SUBJECTS[subject] || !subjectsFor(curriculum, settings.english).includes(subject)) return <Navigate to="/" replace />;

  const s = getStats();
  const round = getRound(s, subject, grade);
  // unfinished runs of this subject in this round → orange ring + "continue" in the mode picker
  const runs = listResume((m) => m.subject === subject && m.grade === grade && (m.cycle ?? 0) === round.cycle);
  const runsFor = (kind, a, b) => runs.filter((x) => x.meta.kind === kind && (kind === 'mock' ? x.meta.number === a : x.meta.topic === a && x.meta.variant === b));
  // wrong + skipped tasks left from the last finished attempt of a test / topic set
  const fixFor = (kind, a, b) => {
    const l = leftToFix(kind === 'mock' ? { kind, subject, grade, number: a, cycle: round.cycle } : { kind, subject, grade, topic: a, variant: b, cycle: round.cycle });
    return l ? l.bad + l.skip : 0;
  };
  const minutes = SUBJECTS[subject].minutes;
  const nTasks = blueprintFor(subject, grade).length;
  const SET_SIZE = 12; // tasks in one topic set (see Player)
  const topics = topicsFor(subject, grade);
  const tabs = [['tests', t('tab.tests')], ['topics', t('tab.topics')]];

  const start = (mode) => {
    const href = `${pick.href}${pick.href.includes('?') ? '&' : '?'}mode=${mode}`;
    setPick(null);
    navigate(href);
  };
  const resetRound = () => {
    startNewRound(subject, grade);
    setConfirmReset(false);
    bump((n) => n + 1);
  };

  return (
    <div className="paper min-h-screen">
      {/* frozen header: back, subject, tabs */}
      <header className="sticky top-0 z-20 bg-paper/95 backdrop-blur border-b border-line" style={{ paddingTop: 'var(--safe-top)' }}>
        <div className="max-w-3xl mx-auto px-3 pt-2 pb-2">
          <div className="flex items-center gap-1.5">
            <Link to="/" aria-label={t('common.back')} className="w-10 h-10 rounded-xl grid place-items-center hover:bg-pen-soft">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-2xl" aria-hidden="true">{SUBJECTS[subject].emoji}</span>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-extrabold text-xl leading-tight break-words">{t(`subject.${subject}`)}</h1>
              <p className="text-xs text-ink-soft">{t('grade.n', { g: grade })}{subjectLevel(subject, grade) && ` · ${t('level.en', { l: subjectLevel(subject, grade) })}`}</p>
            </div>
            <button onClick={() => setHelp(true)} aria-expanded={help} aria-label={t('howTo.title')} className={cn('w-10 h-10 rounded-xl grid place-items-center', help ? 'bg-pen-soft text-pen' : 'hover:bg-pen-soft')}>
              <CircleHelp className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2" role="tablist">
            {tabs.map(([id, label], i) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={cn('rounded-full py-2 text-sm font-extrabold flex items-center justify-center gap-1.5 border-2 transition-colors',
                  tab === id ? 'border-[#1B2340] bg-marker text-[#1B2340] shadow-[2px_2px_0_0_rgba(27,35,64,0.85)]' : 'border-line bg-sheet text-ink-soft')}>
                <span aria-hidden="true">{i === 0 ? '📝' : '🧩'}</span>{label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 pt-3 pb-10">

        {/* how much there is to practise in this subject and grade */}
        <section className="mb-3 grid grid-cols-2 gap-2">
          <div className="sheet px-3 py-2.5">
            <p className="text-[11px] font-bold text-ink-soft">📝 {t('subj.tests')}</p>
            <p className="font-heading font-extrabold text-xl tabular leading-tight">{MOCK_COUNT}</p>
            <p className="text-[11px] text-ink-soft tabular">{t('subj.tasks', { n: MOCK_COUNT * nTasks })}</p>
          </div>
          <div className="sheet px-3 py-2.5">
            <p className="text-[11px] font-bold text-ink-soft">🧩 {t('subj.sets')}</p>
            <p className="font-heading font-extrabold text-xl tabular leading-tight">{topics.length * TOPIC_VARIANTS}</p>
            <p className="text-[11px] text-ink-soft tabular">{t('subj.tasks', { n: topics.length * TOPIC_VARIANTS * SET_SIZE })}</p>
          </div>
          <p className="col-span-2 px-1 text-[11px] text-ink-soft">{t('subj.fresh')}</p>
        </section>

        {/* round progress: everything green → new round with fresh tasks */}
        <section className="sheet p-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold">{t('round.title', { n: round.cycle + 1 })}</span>
            <span className="ms-auto text-sm font-bold tabular">{round.done}/{round.total}</span>
          </div>
          <div className="h-2.5 rounded-full bg-line mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-ok transition-all" style={{ width: `${(round.done / round.total) * 100}%` }} />
          </div>
          <div className="mt-2 flex items-start gap-2">
            <p className="text-xs text-ink-soft flex-1">{t('round.desc')}</p>
            {round.done > 0 && (
              confirmReset ? (
                <span className="flex gap-1 shrink-0">
                  <button onClick={resetRound} className="rounded-lg bg-redpen text-white px-2 py-1 text-xs font-bold">{t('round.resetYes')}</button>
                  <button onClick={() => setConfirmReset(false)} className="rounded-lg border border-line px-2 py-1 text-xs font-bold">{t('common.cancel')}</button>
                </span>
              ) : (
                <button onClick={() => setConfirmReset(true)} className="shrink-0 flex items-center gap-1 text-xs font-bold text-ink-soft hover:text-pen">
                  <RotateCcw className="w-3.5 h-3.5" />{t('round.reset')}
                </button>
              )
            )}
          </div>
        </section>

        {tab === 'tests' && (
          <>
            <p className="text-xs text-ink-soft mb-2 px-1">{t('tests.info', { n: nTasks, min: minutes })}</p>
            {!premium && <UnlockBar t={t} onClick={() => setPaywall(true)} />}
            <div className="space-y-3">
              {Array.from({ length: MOCK_LEVELS }, (_, l) => l).map((l) => {
                const nums = Array.from({ length: MOCK_PER_LEVEL }, (_, i) => l * MOCK_PER_LEVEL + i + 1);
                const doneHere = nums.filter((n) => round.items[`t:${n}`] !== undefined).length;
                return (
                  <section key={l} className={cn('sheet p-3', doneHere === nums.length && 'border-ok')}>
                    <h3 className="flex items-center gap-2 mb-2">
                      <span aria-hidden="true">{LEVEL_EMOJI[l]}</span>
                      <span className="font-heading font-bold">{t(`level.${l + 1}`)}</span>
                      <span className="ms-auto text-xs font-bold text-ink-soft tabular">{doneHere}/{nums.length}</span>
                    </h3>
                    {/* each test is a small "worksheet" card: number, and the best score once done */}
                    <div className="grid grid-cols-5 gap-2">
                      {nums.map((n) => {
                        const best = round.items[`t:${n}`];
                        const done = best !== undefined;
                        const going = !done && runsFor('mock', n).length > 0;
                        const lock = locked('mock', { number: n });
                        return (
                          <button key={n} aria-label={t('tests.variant', { n })} title={lock ? t('pay.locked') : undefined}
                            onClick={() => lock ? setPaywall(true) : setPick({ href: `/play/mock?subject=${subject}&n=${n}`, title: t('tests.variant', { n }), timed: true, runs: runsFor('mock', n), fix: fixFor('mock', n) })}
                            className={cn('relative aspect-[4/5] rounded-lg border-2 flex flex-col items-center justify-center leading-none tabular overflow-hidden transition-transform active:scale-95',
                              done ? 'border-[#1B2340] bg-[#BDF0CF] text-[#1B2340] shadow-[2px_2px_0_0_rgba(27,35,64,0.85)]'
                                : going ? 'border-[#1B2340] bg-marker/60 text-[#1B2340] shadow-[2px_2px_0_0_rgba(27,35,64,0.85)]'
                                  : 'border-line bg-sheet hover:border-pen')}>
                            {/* folded corner = a sheet of paper */}
                            <span className={cn('absolute top-0 end-0 w-3 h-3 rounded-bl-md', done || going ? 'bg-[#1B2340]/20' : 'bg-line')} aria-hidden="true" />
                            <span className="font-heading font-extrabold text-lg">{n}</span>
                            <span className="mt-1 text-[10px] font-bold">{done ? `${best}/50` : lock ? <Lock className="w-3 h-3 text-ink-soft" aria-hidden="true" /> : going ? '↺' : <span className="opacity-0">·</span>}</span>
                            {fixFor('mock', n) > 0 && (
                              <span className="absolute bottom-1 inset-x-1 rounded-md bg-redpen text-white text-[10px] font-extrabold py-0.5" aria-label={t('mode.fix', { n: fixFor('mock', n) })}>✗ {fixFor('mock', n)}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

          </>
        )}

        {tab === 'topics' && !premium && <UnlockBar t={t} onClick={() => setPaywall(true)} />}
        {tab === 'topics' && (
          <ul className="space-y-2">
            {topics.map((topic) => {
              const acc = topicAccuracy(s, subject, grade, topic);
              const variants = Array.from({ length: TOPIC_VARIANTS }, (_, i) => i + 1);
              const doneN = variants.filter((v) => round.items[`v:${topic}:${v}`] !== undefined).length;
              const all = doneN === variants.length;
              return (
                <li key={topic} className={cn('sheet p-3', all && 'border-ok bg-ok-soft')}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-7 text-center" aria-hidden="true">{TOPIC_EMOJI[topic]}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold leading-snug text-[15px]">{t(`topic.${topic}`)}</span>
                      <span className="text-xs text-ink-soft">{acc === null ? t('topics.notYet') : t('topics.accuracy', { p: Math.round(acc * 100) })}</span>
                    </span>
                    {all && <Check className="w-5 h-5 text-ok" aria-label={t('round.allDone')} />}
                  </div>
                  {/* the 5 sets are stepping stones on a path */}
                  <div className="mt-2.5 relative flex justify-between px-1">
                    <span className="absolute inset-x-5 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-line" aria-hidden="true" />
                    {variants.map((v) => {
                      const done = round.items[`v:${topic}:${v}`] !== undefined;
                      const going = !done && runsFor('topic', topic, v).length > 0;
                      const lock = locked('topic', { variant: v });
                      return (
                        <button key={v} aria-label={t('topics.variantTitle', { topic: t(`topic.${topic}`), n: v })} title={lock ? t('pay.locked') : undefined}
                          onClick={() => lock ? setPaywall(true) : setPick({ href: `/play/topic?subject=${subject}&topic=${topic}&v=${v}`, title: t('topics.variantTitle', { topic: t(`topic.${topic}`), n: v }), timed: false, runs: runsFor('topic', topic, v), fix: fixFor('topic', topic, v) })}
                          className={cn('relative w-10 h-10 rounded-full border-2 font-heading font-extrabold text-sm tabular grid place-items-center transition-transform active:scale-90',
                            done ? 'border-[#1B2340] bg-[#BDF0CF] text-[#1B2340]' : going ? 'border-[#1B2340] bg-marker text-[#1B2340]' : 'border-line bg-sheet hover:border-pen')}>
                          {done ? <Check className="w-4 h-4" /> : v}
                          {lock && !done && <span className="absolute -bottom-1 -end-1 w-4 h-4 rounded-full bg-sheet border border-line grid place-items-center" aria-hidden="true"><Lock className="w-2.5 h-2.5 text-ink-soft" /></span>}
                          {fixFor('topic', topic, v) > 0 && <span className="absolute -top-1.5 -end-1.5 min-w-4 h-4 px-0.5 rounded-full bg-redpen text-white text-[9px] font-extrabold grid place-items-center">{fixFor('topic', topic, v)}</span>}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {isCz && (subject === 'math' || subject === 'czech') && (
          <p className="mt-4 px-1 text-xs text-ink-soft">{t('cz.standard')}</p>
        )}
        {curriculum === 'sk' && (subject === 'math' || subject === 'slovak') && (
          <p className="mt-4 px-1 text-xs text-ink-soft">{t('sk.standard')}</p>
        )}
      </div>

      {/* help: a sheet over the screen, so it is visible wherever the child has scrolled */}
      <AnimatePresence>
        {help && (
          <motion.div className="fixed inset-0 z-40 bg-ink/40 grid place-items-end sm:place-items-center p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHelp(false)}>
            <motion.div role="dialog" aria-modal="true" aria-label={t('howTo.title')} className="sheet w-full max-w-md p-4 max-h-[80vh] overflow-y-auto text-sm space-y-4" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} style={{ marginBottom: 'var(--safe-bottom)' }}>
              <div className="flex items-center">
                <h2 className="font-heading font-bold text-lg flex-1">{t('howTo.title')}</h2>
                <button onClick={() => setHelp(false)} aria-label={t('common.close')} className="w-9 h-9 rounded-xl grid place-items-center hover:bg-pen-soft"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-1">
                {['howTo.1', 'howTo.2'].map((k) => <p key={k} className="flex gap-1.5"><Check className="w-4 h-4 mt-0.5 text-pen shrink-0" />{t(k)}</p>)}
              </div>
              <div>
                <h3 className="font-heading font-bold text-pen mb-1.5">{t('help.lg')}</h3>
                <div className="space-y-2">
                  <p className="flex items-center gap-2.5"><span className="w-8 h-9 shrink-0 rounded-md border-2 border-[#1B2340] bg-[#BDF0CF] text-[#1B2340] text-[10px] font-extrabold grid place-items-center leading-none">43</span>{t('help.done')}</p>
                  <p className="flex items-center gap-2.5"><span className="w-8 h-9 shrink-0 rounded-md border-2 border-[#1B2340] bg-marker/60 text-[#1B2340] text-xs font-extrabold grid place-items-center">↺</span>{t('help.going')}</p>
                  <p className="flex items-center gap-2.5"><span className="w-8 h-9 shrink-0 rounded-md border-2 border-line bg-sheet grid place-items-end p-0.5"><span className="w-full rounded bg-redpen text-white text-[9px] font-extrabold text-center">✗ 2</span></span>{t('help.fix')}</p>
                </div>
              </div>
              <div className="space-y-1">
                {['help.pts', 'help.half', 'help.round'].map((k) => <p key={k} className="flex gap-1.5"><Check className="w-4 h-4 mt-0.5 text-pen shrink-0" />{t(k)}</p>)}
              </div>
              <div>
                <h3 className="font-heading font-bold text-pen mb-1">{t('controls.title')}</h3>
                {['controls.1', 'controls.2', 'controls.3', 'controls.4'].map((k) => <p key={k} className="flex gap-1.5"><Check className="w-4 h-4 mt-0.5 text-pen shrink-0" />{t(k)}</p>)}
              </div>
              <button onClick={() => setHelp(false)} className="w-full h-11 rounded-2xl bg-pen text-on-pen font-bold">{t('common.close')}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* mode picker */}
      <AnimatePresence>
        {pick && (
          <motion.div className="fixed inset-0 z-40 bg-ink/40 grid place-items-end sm:place-items-center p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPick(null)}>
            <motion.div role="dialog" aria-modal="true" aria-label={t('mode.title')} className="sheet w-full max-w-md p-4" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} style={{ marginBottom: 'var(--safe-bottom)' }}>
              <p className="text-sm text-ink-soft">{t('mode.title')}</p>
              <h2 className="font-heading font-bold text-xl mb-1">{pick.title}</h2>
              <div className="space-y-2 mt-3">
                {pick.fix > 0 && !(pick.runs || []).some((run) => run.meta.mode === 'practice') && (
                  <button onClick={() => { const href = `${pick.href}&fix=1&mode=practice`; setPick(null); navigate(href); }}
                    className="w-full flex items-center gap-3 rounded-2xl border-[3px] border-[#1B2340] bg-redpen text-white p-3.5 text-start shadow-[3px_3px_0_0_rgba(27,35,64,0.85)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                    <RotateCcw className="w-6 h-6 shrink-0" />
                    <span className="font-bold">{t('mode.fix', { n: pick.fix })}</span>
                  </button>
                )}
                {(pick.runs || []).map((run) => (
                  <button key={run.key} onClick={() => start(run.meta.mode)} className="w-full flex items-start gap-3 rounded-2xl border-2 border-marker bg-marker/20 p-3.5 text-start">
                    <span className="text-xl leading-none mt-0.5" aria-hidden="true">↺</span>
                    <span><span className="block font-bold">{t('resume.continue')}</span><span className="block text-sm text-ink-soft">{t(run.meta.mode === 'sim' ? 'mode.sim' : 'mode.practice')} · {t('resume.progress', { a: run.answered, b: run.meta.total })}</span></span>
                  </button>
                ))}
                {pick.timed && (
                  <button onClick={() => start('sim')} className="w-full flex items-start gap-3 rounded-2xl border-2 border-line p-3.5 text-start hover:border-pen">
                    <Timer className="w-6 h-6 text-pen shrink-0 mt-0.5" />
                    <span><span className="block font-bold">{t('mode.sim')}</span><span className="block text-sm text-ink-soft">{t('mode.simDesc', { min: minutes })}</span></span>
                  </button>
                )}
                <button onClick={() => start('practice')} className="w-full flex items-start gap-3 rounded-2xl border-2 border-pen bg-pen-soft p-3.5 text-start">
                  <Dumbbell className="w-6 h-6 text-pen shrink-0 mt-0.5" />
                  <span><span className="block font-bold">{t('mode.practice')}</span><span className="block text-sm text-ink-soft">{t('mode.practiceDesc')}</span></span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <PaywallSheet open={paywall} onClose={() => setPaywall(false)} />
    </div>
  );
}

// free version: a slim bar above the tiles that opens the full-version sheet
function UnlockBar({ t, onClick }) {
  return (
    <button onClick={onClick} className="w-full mb-3 flex items-center gap-3 rounded-2xl border-2 border-[#1B2340] bg-marker/50 text-[#1B2340] px-3 py-2.5 text-start shadow-[2px_2px_0_0_rgba(27,35,64,0.85)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
      <Lock className="w-5 h-5 shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block font-bold leading-tight">{t('pay.bar')}</span>
        <span className="block text-xs leading-snug opacity-80">{t('pay.barHint')}</span>
      </span>
      <span className="font-heading font-extrabold text-sm shrink-0">{t('pay.unlock')} →</span>
    </button>
  );
}
