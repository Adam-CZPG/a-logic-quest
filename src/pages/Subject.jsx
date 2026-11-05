import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Timer, Dumbbell, Check, CircleHelp, Package, ChevronRight } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { getStats, topicAccuracy } from '@/exam/stats';
import { getPackTests } from '@/exam/packs';
import { CURRICULA, SUBJECTS, MOCK_SERIES, MOCK_VARIANTS_PER_SERIES, OFFICIAL_YEARS, topicsFor, tauUrl, CERMAT_ARCHIVE_URL, TOPIC_EMOJI, BLUEPRINTS } from '@/exam/taxonomy';
import { openExternal } from '@/lib/native';
import { cn } from '@/lib/utils';

function Done({ best, max = 50 }) {
  if (best === undefined) return null;
  return <span className="text-[11px] font-bold text-ok tabular">{best}/{max}</span>;
}

export default function Subject() {
  const { subject } = useParams();
  const [params, setParams] = useSearchParams();
  const { settings, t } = useSettings();
  const navigate = useNavigate();
  const [pick, setPick] = useState(null); // { href, title, timed, year }
  const [help, setHelp] = useState(false);
  const { grade, curriculum } = settings;
  const isCz = curriculum === 'cz';
  const tab = params.get('tab') || 'tests';
  const setTab = (v) => setParams({ tab: v }, { replace: true });

  if (!SUBJECTS[subject] || !(CURRICULA[curriculum]?.subjects || []).includes(subject)) return <Navigate to="/" replace />;

  const s = getStats();
  const minutes = SUBJECTS[subject].minutes;
  const nTasks = (BLUEPRINTS[subject][grade] || []).length;
  const topics = topicsFor(subject, grade);
  const packTests = getPackTests({ subject, grade });
  const tabs = [['tests', t('tab.tests')], ['topics', t('tab.topics')], ...(isCz ? [['years', t('tab.years')]] : [])];

  const start = (mode) => {
    const href = `${pick.href}${pick.href.includes('?') ? '&' : '?'}mode=${mode}`;
    setPick(null);
    navigate(href);
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
              <h1 className="font-heading font-extrabold text-xl leading-tight truncate">{t(`subject.${subject}`)}</h1>
              <p className="text-xs text-ink-soft">{t('grade.n', { g: grade })}</p>
            </div>
            <button onClick={() => setHelp((h) => !h)} aria-expanded={help} aria-label={t('howTo.title')} className={cn('w-10 h-10 rounded-xl grid place-items-center', help ? 'bg-pen-soft text-pen' : 'hover:bg-pen-soft')}>
              <CircleHelp className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2 flex rounded-xl border border-line p-0.5 bg-sheet" role="tablist">
            {tabs.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={cn('flex-1 rounded-lg py-1.5 text-sm font-bold', tab === id ? 'bg-pen text-on-pen' : 'text-ink-soft')}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 pt-3 pb-10">
        {help && (
          <div className="sheet mb-3 p-3 text-sm grid sm:grid-cols-2 gap-3">
            <div>
              <h2 className="font-heading font-bold text-pen mb-1">{t('howTo.title')}</h2>
              {['howTo.1', 'howTo.2'].map((k) => <p key={k} className="flex gap-1.5"><Check className="w-4 h-4 mt-0.5 text-pen shrink-0" />{t(k)}</p>)}
            </div>
            <div>
              <h2 className="font-heading font-bold text-pen mb-1">{t('controls.title')}</h2>
              {['controls.1', 'controls.2', 'controls.3', 'controls.4'].map((k) => <p key={k} className="flex gap-1.5"><Check className="w-4 h-4 mt-0.5 text-pen shrink-0" />{t(k)}</p>)}
            </div>
          </div>
        )}

        {tab === 'tests' && (
          <>
            <p className="text-xs text-ink-soft mb-2 px-1">{t('tests.info', { n: nTasks, min: minutes })}</p>
            <div className="sheet divide-y divide-line">
              {Array.from({ length: MOCK_SERIES }, (_, i) => i + 1).map((series) => (
                <div key={series} className="flex items-center gap-2 px-3 py-2">
                  <span className="font-heading font-bold w-[4.5rem] shrink-0 text-sm">{t('tests.series', { n: series })}</span>
                  <div className="flex-1 grid grid-cols-4 gap-1.5">
                    {MOCK_VARIANTS_PER_SERIES.map((v) => {
                      const key = `${subject}:${grade}:${series}${v}`;
                      const best = s.mocks[key] ?? s.tried[key];
                      return (
                        <button key={v}
                          onClick={() => setPick({ href: `/play/mock?subject=${subject}&series=${series}&variant=${v}`, title: t('tests.variantL', { v: `${series}${v}` }), timed: true })}
                          className={cn('h-11 rounded-xl border-2 flex flex-col items-center justify-center font-bold leading-none', best !== undefined ? 'border-ok bg-ok-soft' : 'border-line hover:border-pen')}>
                          <span>{v}</span>
                          <Done best={best} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {packTests.length > 0 && (
              <div className="sheet p-3 mt-3">
                <h3 className="font-heading font-bold mb-1 flex items-center gap-2"><Package className="w-4 h-4" />{t('packs.title')}</h3>
                <ul>
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
          </>
        )}

        {tab === 'topics' && (
          <ul className="sheet divide-y divide-line overflow-hidden">
            {topics.map((topic) => {
              const acc = topicAccuracy(s, subject, grade, topic);
              return (
                <li key={topic}>
                  <button
                    onClick={() => setPick({ href: `/play/topic?subject=${subject}&topic=${topic}`, title: t(`topic.${topic}`), timed: false })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-start hover:bg-pen-soft/60"
                  >
                    <span className="text-xl w-7 text-center" aria-hidden="true">{TOPIC_EMOJI[topic]}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold leading-snug text-[15px]">{t(`topic.${topic}`)}</span>
                      <span className="flex items-center gap-2 mt-1">
                        <span className="flex-1 h-1.5 rounded-full bg-line overflow-hidden max-w-[10rem]">
                          <span className={cn('block h-full rounded-full', acc === null ? '' : acc >= 0.7 ? 'bg-ok' : acc >= 0.4 ? 'bg-marker' : 'bg-redpen')} style={{ width: `${(acc ?? 0) * 100}%` }} />
                        </span>
                        <span className="text-xs text-ink-soft">{acc === null ? t('topics.notYet') : t('topics.accuracy', { p: Math.round(acc * 100) })}</span>
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-ink-soft" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {tab === 'years' && isCz && (
          <>
            <p className="text-xs text-ink-soft mb-2 px-1">{t('official.pick')}</p>
            <div className="sheet divide-y divide-line">
              {OFFICIAL_YEARS.map(({ year, terms }) => (
                <div key={year} className="flex items-center gap-2 px-3 py-2">
                  <span className="font-heading font-bold w-12 shrink-0 tabular">{year}</span>
                  <div className="flex-1 grid grid-cols-4 gap-1.5">
                    {Array.from({ length: terms }, (_, i) => i + 1).map((term) => {
                      const key = `${subject}:${grade}:${year}/${term}`;
                      const best = s.mocks[key] ?? s.tried[key];
                      return (
                        <button key={term}
                          onClick={() => setPick({ href: `/play/year?subject=${subject}&year=${year}&term=${term}`, title: t('official.yearTitle', { year, term }), timed: true, year })}
                          className={cn('h-11 rounded-xl border-2 flex flex-col items-center justify-center font-bold text-sm leading-none', best !== undefined ? 'border-ok bg-ok-soft' : 'border-line hover:border-pen')}>
                          <span>{t('official.term', { n: term })}</span>
                          <Done best={best} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-2xl border-2 border-dashed border-line text-sm">
              <p className="text-ink-soft">{t('official.desc')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => openExternal(tauUrl(subject, grade))} className="rounded-xl border-2 border-line bg-sheet px-3 py-1.5 font-bold flex items-center gap-1.5">
                  {t('official.open')}<ExternalLink className="w-4 h-4" />
                </button>
                <button onClick={() => openExternal(CERMAT_ARCHIVE_URL)} className="rounded-xl border-2 border-line bg-sheet px-3 py-1.5 font-bold flex items-center gap-1.5">
                  {t('official.pdf')}<ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* mode picker */}
      <AnimatePresence>
        {pick && (
          <motion.div className="fixed inset-0 z-40 bg-ink/40 grid place-items-end sm:place-items-center p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPick(null)}>
            <motion.div role="dialog" aria-modal="true" aria-label={t('mode.title')} className="sheet w-full max-w-md p-4" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} style={{ marginBottom: 'var(--safe-bottom)' }}>
              <p className="text-sm text-ink-soft">{t('mode.title')}</p>
              <h2 className="font-heading font-bold text-xl mb-1">{pick.title}</h2>
              {pick.year && <p className="text-sm text-ink-soft mb-3">{t('official.practiceDesc')}</p>}
              <div className="space-y-2 mt-3">
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
                {pick.year && (
                  <button onClick={() => openExternal(tauUrl(subject, grade))} className="w-full flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-ink-soft hover:text-pen">
                    <ExternalLink className="w-4 h-4" />{t('official.original', { year: pick.year })}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
