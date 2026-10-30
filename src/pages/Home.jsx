import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ChevronRight, CalendarCheck, RotateCcw, Puzzle, Check } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useSettings } from '@/lib/settings';
import { getStats, levelFromXp, currentStreak, topicAccuracy } from '@/exam/stats';
import { dailyKey } from '@/exam/engine';
import { CURRICULA, SUBJECTS, topicsFor } from '@/exam/taxonomy';
import { cn } from '@/lib/utils';

function useStats() {
  const [s, setS] = useState(getStats);
  useEffect(() => {
    const r = () => setS(getStats());
    window.addEventListener('lq-stats', r);
    window.addEventListener('focus', r);
    return () => {
      window.removeEventListener('lq-stats', r);
      window.removeEventListener('focus', r);
    };
  }, []);
  return s;
}

// Days to the next CERMAT entrance exam (mid April; 4-year schools a few days earlier).
function daysToExam(grade) {
  const now = new Date();
  let d = new Date(now.getFullYear(), 3, grade === 9 ? 12 : 14);
  if (d < now) d = new Date(now.getFullYear() + 1, 3, grade === 9 ? 12 : 14);
  return Math.ceil((d - now) / 86400000);
}

export default function Home() {
  const { settings, t } = useSettings();
  const s = useStats();
  const { grade, curriculum } = settings;
  const lvl = levelFromXp(s.xp);
  const streak = currentStreak(s);
  const subjects = CURRICULA[curriculum]?.subjects || ['math'];
  const doneToday = !!s.dailyDone[dailyKey()];
  const accuracy = s.solved ? Math.round((s.correct / s.solved) * 100) : null;

  const subjectStats = useMemo(() => subjects.map((sub) => {
    const topics = topicsFor(sub, grade);
    const accs = topics.map((tp) => topicAccuracy(s, sub, grade, tp)).filter((x) => x !== null);
    const mocks = Object.keys(s.mocks).filter((k) => k.startsWith(`${sub}:${grade}:`)).length;
    return { sub, avg: accs.length ? accs.reduce((a, b) => a + b, 0) / accs.length : null, tried: accs.length, total: topics.length, mocks };
  }), [s, grade, subjects.join()]);

  return (
    <AppShell>
      <header className="flex items-center gap-3">
        <Link to="/settings" className="flex items-center gap-2 rounded-full bg-sheet border-2 border-line ps-1 pe-3 py-1 font-bold text-sm">
          <span className="w-7 h-7 rounded-full bg-pen text-on-pen grid place-items-center font-heading">{grade}</span>
          {CURRICULA[curriculum].flag} {t('grade.n', { g: grade })}
        </Link>
        <div className={cn('ms-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold text-sm', streak ? 'bg-marker/40 text-ink' : 'bg-sheet border-2 border-line text-ink-soft')}>
          <Flame className={cn('w-4 h-4', streak && 'text-redpen')} />
          <span className="tabular">{t('home.days', { n: streak })}</span>
        </div>
      </header>

      <section className="mt-6">
        <h1 className="font-heading font-extrabold text-[2rem] leading-tight">{t('home.hello')}</h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="font-heading font-bold">{t('home.level', { n: lvl.level })}</span>
          <div className="flex-1 h-3 rounded-full bg-sheet border-2 border-line overflow-hidden">
            <div className="h-full bg-marker" style={{ width: `${Math.max(4, lvl.progress * 100)}%` }} />
          </div>
          <span className="text-sm text-ink-soft tabular">{s.xp} XP</span>
        </div>
        {curriculum === 'cz' && (
          <p className="mt-2 text-sm text-ink-soft">{t('home.examIn', { n: daysToExam(grade) })}</p>
        )}
      </section>

      {/* today's plan – the daily discipline */}
      <Link to="/play/daily?mode=practice" className={cn('mt-6 block rounded-3xl p-5 border-2 transition-transform active:scale-[0.99]', doneToday ? 'bg-ok-soft border-ok/50' : 'bg-pen text-on-pen border-pen shadow-[0_10px_30px_-12px_hsl(var(--pen)/0.7)]')}>
        <div className="flex items-start gap-4">
          <span className={cn('w-12 h-12 rounded-2xl grid place-items-center shrink-0', doneToday ? 'bg-ok text-white' : 'bg-on-pen/15')}>
            {doneToday ? <Check className="w-6 h-6" /> : <CalendarCheck className="w-6 h-6" />}
          </span>
          <div className="flex-1">
            <h2 className="font-heading font-bold text-xl">{t('home.daily')}</h2>
            <p className={cn('mt-0.5', doneToday ? 'text-ink-soft' : 'text-on-pen/80')}>{doneToday ? t('home.dailyDone') : t('home.dailyDesc')}</p>
            <div className="mt-3 flex gap-1.5">
              {subjects.flatMap((sub) => [0, 1, 2].map((i) => (
                <span key={`${sub}${i}`} className={cn('h-2 flex-1 rounded-full', doneToday ? 'bg-ok' : 'bg-on-pen/30')} />
              )))}
            </div>
          </div>
          <ChevronRight className="w-6 h-6 mt-3 opacity-70 rtl:rotate-180" />
        </div>
      </Link>

      <h2 className="mt-8 mb-3 font-heading font-bold text-lg">{t('home.subjects')}</h2>
      <div className="space-y-3">
        {subjectStats.map(({ sub, avg, tried, total, mocks }) => (
          <Link key={sub} to={`/subject/${sub}`} className="sheet flex items-center gap-4 p-4 hover:border-pen transition-colors">
            <span className="w-14 h-14 rounded-2xl bg-pen-soft grid place-items-center text-3xl shrink-0" aria-hidden="true">{SUBJECTS[sub].emoji}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-lg leading-tight">{t(`subject.${sub}`)}</h3>
              <p className="text-sm text-ink-soft mt-0.5">
                {tried}/{total} · {t('tests.count', { n: mocks })}
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden">
                <div className="h-full bg-ok rounded-full" style={{ width: `${(avg ?? 0) * 100}%` }} />
              </div>
            </div>
            <span className="font-heading font-bold text-lg tabular w-12 text-end">{avg === null ? '–' : `${Math.round(avg * 100)}%`}</span>
          </Link>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link to="/play/mistakes?mode=practice" className={cn('sheet p-4 hover:border-redpen transition-colors', !s.mistakes.length && 'pointer-events-none opacity-70')}>
          <RotateCcw className="w-6 h-6 text-redpen" />
          <h3 className="font-heading font-bold mt-2 leading-tight">{t('home.mistakes')}</h3>
          <p className="text-sm text-ink-soft">{s.mistakes.length ? t('home.mistakesDesc', { n: s.mistakes.length }) : t('home.noMistakes')}</p>
        </Link>
        <Link to="/games" className="sheet p-4 hover:border-pen transition-colors">
          <Puzzle className="w-6 h-6 text-pen" />
          <h3 className="font-heading font-bold mt-2 leading-tight">{t('home.games')}</h3>
          <p className="text-sm text-ink-soft">{t('home.gamesDesc')}</p>
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-center">
        <div className="sheet p-3"><p className="text-ink-soft text-sm">{t('home.solved')}</p><p className="font-heading font-bold text-2xl tabular">{s.solved}</p></div>
        <div className="sheet p-3"><p className="text-ink-soft text-sm">{t('home.accuracy')}</p><p className="font-heading font-bold text-2xl tabular">{accuracy === null ? '–' : `${accuracy}%`}</p></div>
      </div>
    </AppShell>
  );
}
