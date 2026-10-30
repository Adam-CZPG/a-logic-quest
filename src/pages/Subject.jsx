import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, ExternalLink, Timer, Dumbbell, Check, Lightbulb, Package } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { getStats, topicAccuracy } from '@/exam/stats';
import { getPackTests } from '@/exam/packs';
import { CURRICULA, SUBJECTS, MOCK_SERIES, MOCK_VARIANTS_PER_SERIES, OFFICIAL_YEARS, topicsFor, tauUrl, CERMAT_ARCHIVE_URL, TOPIC_EMOJI, BLUEPRINTS } from '@/exam/taxonomy';
import { openExternal } from '@/lib/native';
import { cn } from '@/lib/utils';

function Section({ title, open, onToggle, children }) {
  return (
    <section className="mt-4">
      <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center gap-2 rounded-2xl bg-pen text-on-pen px-4 py-3 font-heading font-bold text-lg">
        {title}
        <ChevronDown className={cn('w-5 h-5 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function Subject() {
  const { subject } = useParams();
  const { settings, t } = useSettings();
  const navigate = useNavigate();
  const [openTests, setOpenTests] = useState(true);
  const [openTopics, setOpenTopics] = useState(true);
  const [pick, setPick] = useState(null); // { href, title, minutes }
  const { grade, curriculum } = settings;

  if (!SUBJECTS[subject] || !(CURRICULA[curriculum]?.subjects || []).includes(subject)) return <Navigate to="/" replace />;

  const s = getStats();
  const minutes = SUBJECTS[subject].minutes;
  const nTasks = (BLUEPRINTS[subject][grade] || []).length;
  const topics = topicsFor(subject, grade);
  const packTests = getPackTests({ subject, grade });

  const start = (mode) => {
    const href = `${pick.href}${pick.href.includes('?') ? '&' : '?'}mode=${mode}`;
    setPick(null);
    navigate(href);
  };

  return (
    <div className="paper min-h-screen" style={{ paddingTop: 'calc(var(--safe-top) + 10px)' }}>
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <header className="flex items-center gap-2">
          <Link to="/" aria-label={t('common.back')} className="w-10 h-10 rounded-xl grid place-items-center hover:bg-pen-soft">
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="font-heading font-extrabold text-2xl leading-tight">{t(`subject.${subject}`)}</h1>
            <p className="text-sm text-ink-soft">{t('grade.n', { g: grade })}</p>
          </div>
        </header>

        {/* how it works (same two columns as the official app) */}
        <div className="sheet mt-4 p-4 grid sm:grid-cols-2 gap-4 text-[15px]">
          <div>
            <h2 className="font-heading font-bold text-pen mb-1.5 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" />{t('howTo.title')}</h2>
            {['howTo.1', 'howTo.2'].map((k) => <p key={k} className="flex gap-2"><Check className="w-4 h-4 mt-1 text-pen shrink-0" />{t(k)}</p>)}
          </div>
          <div>
            <h2 className="font-heading font-bold text-pen mb-1.5">{t('controls.title')}</h2>
            {['controls.1', 'controls.2', 'controls.3', 'controls.4'].map((k) => <p key={k} className="flex gap-2"><Check className="w-4 h-4 mt-1 text-pen shrink-0" />{t(k)}</p>)}
          </div>
        </div>

        <Section title={t('tab.tests')} open={openTests} onToggle={() => setOpenTests((o) => !o)}>
          <p className="text-sm text-ink-soft mb-3">{t('tests.info', { n: nTasks, min: minutes })}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5 sheet p-4">
            {Array.from({ length: MOCK_SERIES }, (_, i) => i + 1).map((series) => (
              <div key={series}>
                <h3 className="font-heading font-bold mb-1.5">{t('tests.series', { n: series })}</h3>
                <ul className="space-y-1">
                  {MOCK_VARIANTS_PER_SERIES.map((v) => {
                    const best = s.mocks[`${subject}:${grade}:${series}${v}`];
                    return (
                      <li key={v}>
                        <button
                          onClick={() => setPick({ href: `/play/mock?subject=${subject}&series=${series}&variant=${v}`, title: t('tests.variantL', { v: `${series}${v}` }), timed: true })}
                          className="w-full flex items-center gap-2 py-1 text-start hover:text-pen group"
                        >
                          <span className={cn('w-5 h-5 rounded-full border-2 grid place-items-center shrink-0', best !== undefined ? 'border-ok bg-ok' : 'border-pen group-hover:bg-pen-soft')}>
                            {best !== undefined && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </span>
                          <span className="flex-1">{t('tests.variantL', { v })}</span>
                          {best !== undefined && <span className="text-xs font-bold text-ok tabular">{best}/50</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {packTests.length > 0 && (
            <div className="sheet p-4 mt-3">
              <h3 className="font-heading font-bold mb-2 flex items-center gap-2"><Package className="w-4 h-4" />{t('packs.title')}</h3>
              <ul className="space-y-1">
                {packTests.map((pt) => (
                  <li key={`${pt.packId}${pt.index}`}>
                    <button onClick={() => setPick({ href: `/play/pack?subject=${subject}&pack=${encodeURIComponent(pt.packId)}&i=${pt.index}`, title: pt.title, timed: !!pt.minutes })} className="w-full text-start py-1.5 hover:text-pen">
                      {pt.title} <span className="text-ink-soft text-sm">· {pt.packName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {curriculum === 'cz' && (
            <div className="sheet p-4 mt-3 border-dashed">
              <h3 className="font-heading font-bold">{t('official.title')}</h3>
              <p className="text-sm text-ink-soft mt-1">{t('official.desc')}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {OFFICIAL_YEARS.map((y) => (
                  <span key={y.year} className="rounded-full bg-paper border border-line px-2.5 py-1 text-sm tabular" title={t('official.terms', { n: y.terms })}>
                    {y.year}<span className="text-ink-soft"> ·{y.terms}</span>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => openExternal(tauUrl(subject, grade))} className="rounded-xl bg-pen text-on-pen px-4 py-2 font-bold flex items-center gap-2">
                  {t('official.open')}<ExternalLink className="w-4 h-4" />
                </button>
                <button onClick={() => openExternal(CERMAT_ARCHIVE_URL)} className="rounded-xl border-2 border-line px-4 py-2 font-bold flex items-center gap-2">
                  {t('official.pdf')}<ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </Section>

        <Section title={t('tab.topics')} open={openTopics} onToggle={() => setOpenTopics((o) => !o)}>
          <ul className="sheet divide-y-2 divide-line overflow-hidden">
            {topics.map((topic) => {
              const acc = topicAccuracy(s, subject, grade, topic);
              return (
                <li key={topic}>
                  <button
                    onClick={() => setPick({ href: `/play/topic?subject=${subject}&topic=${topic}`, title: t(`topic.${topic}`), timed: false })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-pen-soft/60"
                  >
                    <span className="text-2xl w-8 text-center" aria-hidden="true">{TOPIC_EMOJI[topic]}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold leading-snug">{t(`topic.${topic}`)}</span>
                      <span className="flex items-center gap-2 mt-1">
                        <span className="flex-1 h-1.5 rounded-full bg-line overflow-hidden max-w-[12rem]">
                          <span className={cn('block h-full rounded-full', acc === null ? '' : acc >= 0.7 ? 'bg-ok' : acc >= 0.4 ? 'bg-marker' : 'bg-redpen')} style={{ width: `${(acc ?? 0) * 100}%` }} />
                        </span>
                        <span className="text-xs text-ink-soft">{acc === null ? t('topics.notYet') : t('topics.accuracy', { p: Math.round(acc * 100) })}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>

      {/* mode picker */}
      <AnimatePresence>
        {pick && (
          <motion.div className="fixed inset-0 z-40 bg-ink/40 grid place-items-end sm:place-items-center p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPick(null)}>
            <motion.div role="dialog" aria-modal="true" aria-label={t('mode.title')} className="sheet w-full max-w-md p-5" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} style={{ marginBottom: 'var(--safe-bottom)' }}>
              <p className="text-sm text-ink-soft">{t('mode.title')}</p>
              <h2 className="font-heading font-bold text-xl mb-4">{pick.title}</h2>
              <div className="space-y-2.5">
                {pick.timed && (
                  <button onClick={() => start('sim')} className="w-full flex items-start gap-3 rounded-2xl border-2 border-line p-4 text-start hover:border-pen">
                    <Timer className="w-6 h-6 text-pen shrink-0 mt-0.5" />
                    <span><span className="block font-bold">{t('mode.sim')}</span><span className="block text-sm text-ink-soft">{t('mode.simDesc', { min: minutes })}</span></span>
                  </button>
                )}
                <button onClick={() => start('practice')} className="w-full flex items-start gap-3 rounded-2xl border-2 border-pen bg-pen-soft p-4 text-start">
                  <Dumbbell className="w-6 h-6 text-pen shrink-0 mt-0.5" />
                  <span><span className="block font-bold">{t('mode.practice')}</span><span className="block text-sm text-ink-soft">{t('mode.practiceDesc')}</span></span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
