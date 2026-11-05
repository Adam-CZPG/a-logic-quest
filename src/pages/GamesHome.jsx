import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Star, Play, Volume2, VolumeX, Trophy, Flame, ChevronDown, ChevronRight } from 'lucide-react';
import AppShell, { PageTitle } from '@/components/AppShell';
import { TOTAL_LEVELS } from '@/lib/gameEngine';
import { getProgress, isUnlocked, BADGES, STAGE_BADGES } from '@/lib/progress';
import { getLogicStats } from '@/lib/logicEngine';
import { isSoundOn, toggleSound, vibrate, playClick } from '@/lib/sfx';
import { getLang, t as tg } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { cn } from '@/lib/utils';

const STAGES = [
  { range: [1, 15], id: 'beginner', dot: 'bg-emerald-500', icon: '🌱' },
  { range: [16, 30], id: 'easy', dot: 'bg-sky-500', icon: '⭐' },
  { range: [31, 50], id: 'medium', dot: 'bg-violet-500', icon: '⚡' },
  { range: [51, 70], id: 'hard', dot: 'bg-amber-500', icon: '🔥' },
  { range: [71, 90], id: 'expert', dot: 'bg-rose-500', icon: '💎' },
  { range: [91, 120], id: 'master', dot: 'bg-fuchsia-500', icon: '👑' },
];

function LevelCell({ level, progress }) {
  const unlocked = isUnlocked(level, progress);
  const stars = progress.completed[level] || 0;
  const isCurrent = level === progress.unlockedUpTo;
  if (!unlocked) {
    return <div className="aspect-square rounded-xl bg-line/40 grid place-items-center text-ink-soft/50"><Lock className="w-3.5 h-3.5" /></div>;
  }
  return (
    <Link
      to={`/game/${level}`}
      onClick={() => { vibrate(12); playClick(); }}
      className={cn('aspect-square rounded-xl flex flex-col items-center justify-center font-bold text-sm tabular border transition-colors active:scale-95',
        isCurrent ? 'bg-pen text-on-pen border-pen' : 'bg-sheet border-line hover:border-pen')}
    >
      {level}
      <span className="flex gap-px mt-0.5">
        {[1, 2, 3].map((s) => (
          <Star key={s} className={cn('w-2 h-2', s <= stars ? 'fill-marker text-marker' : isCurrent ? 'text-on-pen/40' : 'text-line')} />
        ))}
      </span>
    </Link>
  );
}

export default function GamesHome() {
  const { t } = useSettings();
  const [progress, setProgress] = useState(() => getProgress());
  const [sound, setSound] = useState(() => isSoundOn());
  const [logicStats] = useState(() => getLogicStats());
  const [lang] = useState(() => getLang());

  useEffect(() => {
    const refresh = () => setProgress(getProgress());
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const completedCount = Object.keys(progress.completed).length;
  const totalStars = Object.values(progress.completed).reduce((a, b) => a + b, 0);
  const continueLevel = Math.min(progress.unlockedUpTo, TOTAL_LEVELS);
  const currentStage = STAGES.find((s) => continueLevel >= s.range[0] && continueLevel <= s.range[1]) || STAGES[0];
  const [open, setOpen] = useState(currentStage.id);
  const allBadges = [...BADGES, ...STAGE_BADGES];
  const earned = allBadges.filter((b) => progress.badges?.[b.id]).length;

  function handleSoundToggle() {
    const next = toggleSound();
    setSound(next);
    if (next) playClick();
    vibrate(10);
  }

  // frozen top: title, sound, and the three numbers that matter
  const header = (
    <>
      <PageTitle right={(
        <button onClick={handleSoundToggle} aria-label={t('set.sound')} className="w-9 h-9 rounded-xl border border-line bg-sheet grid place-items-center">
          {sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-ink-soft" />}
        </button>
      )}>
        {t('nav.games')}
      </PageTitle>
      <div className="mt-1.5 flex gap-2 text-sm font-bold tabular">
        <span className="flex items-center gap-1 rounded-full bg-sheet border border-line px-2.5 py-0.5"><Trophy className="w-3.5 h-3.5 text-pen" />{completedCount}/{TOTAL_LEVELS}</span>
        <span className="flex items-center gap-1 rounded-full bg-sheet border border-line px-2.5 py-0.5"><Star className="w-3.5 h-3.5 fill-marker text-marker" />{totalStars}</span>
        <span className="flex items-center gap-1 rounded-full bg-sheet border border-line px-2.5 py-0.5"><Flame className="w-3.5 h-3.5 text-redpen" />{logicStats.best}</span>
      </div>
    </>
  );

  return (
    <AppShell header={header}>
      <div className="grid grid-cols-2 gap-2.5">
        <Link to={`/game/${continueLevel}`} onClick={() => { vibrate(15); playClick(); }} className="rounded-2xl bg-pen text-on-pen p-3 active:scale-[0.98] transition-transform">
          <span className="w-9 h-9 rounded-xl bg-on-pen/15 grid place-items-center"><Play className="w-4 h-4 fill-current" /></span>
          <span className="block mt-2 text-xs opacity-80">{tg(lang, 'appTitle')}</span>
          <span className="block font-heading font-bold leading-tight">{tg(lang, 'continue')} · {continueLevel}</span>
        </Link>
        <Link to="/logic" onClick={() => { vibrate(15); playClick(); }} className="rounded-2xl bg-sheet border-2 border-pen/40 p-3 active:scale-[0.98] transition-transform">
          <span className="w-9 h-9 rounded-xl bg-pen-soft grid place-items-center text-lg">🧩</span>
          <span className="block mt-2 text-xs text-ink-soft">{tg(lang, 'picturePuzzles')}</span>
          <span className="block font-heading font-bold leading-tight">{tg(lang, 'logicMode')}</span>
        </Link>
      </div>

      {/* badges: one compact strip, details on the achievements page */}
      <Link to="/achievements" className="sheet mt-2.5 flex items-center gap-2 px-3 py-2">
        <span className="text-sm font-bold shrink-0">{tg(lang, 'badges')} <span className="text-ink-soft tabular">{earned}/{allBadges.length}</span></span>
        <span className="flex-1 flex gap-1 overflow-hidden justify-end">
          {allBadges.map((b) => (
            <span key={b.id} className={cn('text-base leading-none', !progress.badges?.[b.id] && 'grayscale opacity-30')}>{b.emoji}</span>
          ))}
        </span>
        <ChevronRight className="w-4 h-4 text-ink-soft shrink-0" />
      </Link>

      {/* levels by stage; only one stage open at a time keeps the page short */}
      <div className="mt-4 space-y-2">
        {STAGES.filter((stage) => progress.unlockedUpTo >= stage.range[0]).map((stage) => {
          const levels = [];
          for (let i = stage.range[0]; i <= stage.range[1]; i++) levels.push(i);
          const done = levels.filter((l) => progress.completed[l]).length;
          const isOpen = open === stage.id;
          return (
            <section key={stage.id} className="sheet overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : stage.id)} aria-expanded={isOpen} className="w-full flex items-center gap-2 px-3 py-2.5 text-start">
                <span className={cn('w-2.5 h-2.5 rounded-full', stage.dot)} />
                <span className="font-bold flex-1">{stage.icon} {tg(lang, stage.id)}</span>
                <span className="text-xs text-ink-soft tabular">{done}/{levels.length}</span>
                <ChevronDown className={cn('w-4 h-4 text-ink-soft transition-transform', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 px-3 pb-3">
                  {levels.map((level) => <LevelCell key={level} level={level} progress={progress} />)}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
