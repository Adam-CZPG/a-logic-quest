import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ChevronRight, CalendarCheck, RotateCcw, Check, Target } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useSettings } from '@/lib/settings';
import { getStats, levelFromXp, currentStreak, topicAccuracy } from '@/exam/stats';
import { dailyKey } from '@/exam/engine';
import { CURRICULA, SUBJECTS, topicsFor } from '@/exam/taxonomy';
import { cn } from '@/lib/utils';

export function useStats() {
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

export function Avatar({ name, className }) {
  const letter = (name || '').trim().charAt(0).toUpperCase() || '🙂';
  return (
    <span className={cn('rounded-full bg-pen text-on-pen grid place-items-center font-heading font-extrabold shrink-0', className)} aria-hidden="true">
      {letter}
    </span>
  );
}

export default function Home() {
  const { settings, t } = useSettings();
  const s = useStats();
  const { grade, curriculum, name } = settings;
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

  // frozen top: who, which grade, streak and level – always visible while scrolling
  const header = (
    <>
      <div className="flex items-center gap-2.5">
        <Link to="/settings" className="flex items-center gap-2.5 min-w-0 flex-1">
          <Avatar name={name} className="w-10 h-10 text-lg" />
          <span className="min-w-0">
            <span className="block font-heading font-extrabold text-lg leading-tight truncate">
              {name ? t('home.helloName', { name }) : t('home.hello')}
            </span>
            <span className="block text-xs text-ink-soft font-bold">
              {CURRICULA[curriculum].flag} {t('grade.n', { g: grade })}
              {curriculum === 'cz' && <> · {t('home.examIn', { n: daysToExam(grade) })}</>}
            </span>
          </span>
        </Link>
        <span className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 font-bold text-sm tabular', streak ? 'bg-marker/40' : 'bg-sheet border border-line text-ink-soft')}>
          <Flame className={cn('w-4 h-4', streak && 'text-redpen')} />{streak}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="font-heading font-bold">{t('home.level', { n: lvl.level })}</span>
        <div className="flex-1 h-2 rounded-full bg-sheet border border-line overflow-hidden">
          <div className="h-full bg-marker" style={{ width: `${Math.max(4, lvl.progress * 100)}%` }} />
        </div>
        <span className="text-ink-soft tabular">{s.xp} XP</span>
      </div>
    </>
  );

  return (
    <AppShell header={header}>
      {!name && (
        <Link to="/settings" className="mb-2.5 flex items-center gap-2 rounded-2xl border-2 border-dashed border-pen/50 bg-pen-soft px-3 py-2.5 font-bold text-sm text-pen">
          ✏️ <span className="flex-1">{t('home.addName')}</span><ChevronRight className="w-4 h-4" />
        </Link>
      )}
      {/* today's plan – the daily discipline */}
      <Link to="/play/daily?mode=practice" className={cn('flex items-center gap-3 rounded-2xl p-3.5 border-2 transition-transform active:scale-[0.99]', doneToday ? 'bg-ok-soft border-ok/50' : 'bg-pen text-on-pen border-pen shadow-[0_8px_24px_-12px_hsl(var(--pen)/0.7)]')}>
        <span className={cn('w-10 h-10 rounded-xl grid place-items-center shrink-0', doneToday ? 'bg-ok text-white' : 'bg-on-pen/15')}>
          {doneToday ? <Check className="w-5 h-5" /> : <CalendarCheck className="w-5 h-5" />}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading font-bold leading-tight">{t('home.daily')}</h2>
          <p className={cn('text-sm leading-snug truncate', doneToday ? 'text-ink-soft' : 'text-on-pen/80')}>{doneToday ? t('home.dailyDone') : t('home.dailyDesc')}</p>
          <div className="mt-1.5 flex gap-1">
            {subjects.flatMap((sub) => [0, 1, 2].map((i) => (
              <span key={`${sub}${i}`} className={cn('h-1.5 flex-1 rounded-full', doneToday ? 'bg-ok' : 'bg-on-pen/30')} />
            )))}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 opacity-70" />
      </Link>

      <h2 className="mt-5 mb-2 font-heading font-bold">{t('home.subjects')}</h2>
      <div className={cn('grid gap-2.5', subjectStats.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
        {subjectStats.map(({ sub, avg, tried, total, mocks }) => (
          <Link key={sub} to={`/subject/${sub}`} className="sheet p-3 hover:border-pen transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-pen-soft grid place-items-center text-xl shrink-0" aria-hidden="true">{SUBJECTS[sub].emoji}</span>
              <h3 className="font-heading font-bold text-[15px] leading-tight flex-1 min-w-0 line-clamp-2 break-words">{t(`subject.${sub}`)}</h3>
            </div>
            <div className="mt-2.5 flex items-end justify-between gap-2">
              <span className="text-xs text-ink-soft leading-tight">{tried}/{total}<br />{t('tests.count', { n: mocks })}</span>
              <span className="font-heading font-bold text-xl tabular leading-none">{avg === null ? '–' : `${Math.round(avg * 100)}%`}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden">
              <div className="h-full bg-ok rounded-full" style={{ width: `${(avg ?? 0) * 100}%` }} />
            </div>
          </Link>
        ))}
      </div>

      {s.mistakes.length > 0 && (
        <Link to="/play/mistakes?mode=practice" className="sheet mt-2.5 flex items-center gap-3 p-3 hover:border-redpen transition-colors">
          <RotateCcw className="w-5 h-5 text-redpen shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block font-bold leading-tight">{t('home.mistakes')}</span>
            <span className="block text-xs text-ink-soft">{t('home.mistakesDesc', { n: s.mistakes.length })}</span>
          </span>
          <ChevronRight className="w-5 h-5 text-ink-soft" />
        </Link>
      )}

      <Link to="/stats" className="sheet mt-2.5 grid grid-cols-3 divide-x divide-line text-center py-2.5 hover:border-pen">
        <span><span className="block font-heading font-bold text-xl tabular">{s.solved}</span><span className="block text-[11px] text-ink-soft">{t('home.solved')}</span></span>
        <span><span className="block font-heading font-bold text-xl tabular">{accuracy === null ? '–' : `${accuracy}%`}</span><span className="block text-[11px] text-ink-soft">{t('home.accuracy')}</span></span>
        <span className="flex flex-col items-center justify-center"><Target className="w-5 h-5 text-pen" /><span className="block text-[11px] text-ink-soft">{t('st.journey')}</span></span>
      </Link>
    </AppShell>
  );
}
