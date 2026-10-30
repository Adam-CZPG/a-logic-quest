import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Star, Brain, Sparkles, Play, Volume2, VolumeX, Trophy, Medal, Flame } from 'lucide-react';
import { TOTAL_LEVELS } from '@/lib/gameEngine';
import { getProgress, isUnlocked, BADGES, STAGE_BADGES } from '@/lib/progress';
import { getLogicStats } from '@/lib/logicEngine';
import { isSoundOn, toggleSound, vibrate, playClick } from '@/lib/sfx';
import { getLang, t } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';

const STAGES = [
  { range: [1, 15], id: 'beginner', gradient: 'from-emerald-400 to-teal-500', border: 'border-emerald-400/40', text: 'text-emerald-300', icon: '🌱' },
  { range: [16, 30], id: 'easy', gradient: 'from-sky-400 to-blue-500', border: 'border-sky-400/40', text: 'text-sky-300', icon: '⭐' },
  { range: [31, 50], id: 'medium', gradient: 'from-violet-400 to-purple-500', border: 'border-violet-400/40', text: 'text-violet-300', icon: '⚡' },
  { range: [51, 70], id: 'hard', gradient: 'from-amber-400 to-orange-500', border: 'border-amber-400/40', text: 'text-amber-300', icon: '🔥' },
  { range: [71, 90], id: 'expert', gradient: 'from-rose-400 to-pink-500', border: 'border-rose-400/40', text: 'text-rose-300', icon: '💎' },
  { range: [91, 120], id: 'master', gradient: 'from-fuchsia-500 to-red-500', border: 'border-fuchsia-400/40', text: 'text-fuchsia-300', icon: '👑' },
];

function LevelButton({ level, stage, progress, index }) {
  const unlocked = isUnlocked(level, progress);
  const stars = progress.completed[level] || 0;
  const isCurrent = level === progress.unlockedUpTo;

  if (!unlocked) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.01 }}
        className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/25"
      >
        <Lock className="w-4 h-4" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 10 }}
      animate={{ opacity: 1, scale: isCurrent ? 1.08 : 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: index * 0.01 }}
      whileTap={{ scale: 0.85 }}
    >
      <Link
        to={`/game/${level}`}
        onClick={() => { vibrate(12); playClick(); }}
        className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center font-bold transition-colors
          ${isCurrent
            ? `bg-gradient-to-br ${stage.gradient} text-white shadow-lg ${stage.border} ring-2 ring-white/30`
            : `bg-white/10 text-white hover:bg-white/20 border ${stage.border}`}`}
      >
        <span className="text-lg leading-none">{level}</span>
        <div className="flex gap-0.5 mt-1">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-2.5 h-2.5 ${s <= stars ? 'fill-amber-300 text-amber-300' : 'text-white/20'}`}
            />
          ))}
        </div>
        {isCurrent && (
          <motion.span
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white shadow"
          />
        )}
      </Link>
    </motion.div>
  );
}

export default function GamesHome() {
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
  const currentStage = STAGES.find((s) => continueLevel >= s.range[0] && continueLevel <= s.range[1]);

  function handleSoundToggle() {
    const next = toggleSound();
    setSound(next);
    if (next) playClick();
    vibrate(10);
  }


  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden">
      {/* Floating glow orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-fuchsia-600/10 blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-4 py-8 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 mb-4"
          >
            <Brain className="w-4 h-4 text-violet-300" />
            <span className="text-sm font-medium text-violet-200">{t(lang, 'appChip')}</span>
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-violet-200 to-indigo-300 bg-clip-text text-transparent">
            {t(lang, 'appTitle')}
          </h1>
          <p className="text-white/50 mt-2 text-sm">{t(lang, 'subtitle')}</p>
        </motion.div>

        {/* Back to the exam-prep app */}
        <Link
          to="/"
          aria-label="Back"
          className="absolute top-8 left-4 w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Sound toggle */}
        <button
          onClick={handleSoundToggle}
          className="absolute top-8 right-4 w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition"
        >
          {sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-white/40" />}
        </button>

        {/* Continue button */}
        <Link
          to={`/game/${continueLevel}`}
          onClick={() => { vibrate(15); playClick(); }}
          className="block w-full mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r ${currentStage ? currentStage.gradient : 'from-indigo-500 to-violet-600'} shadow-xl shadow-violet-600/30`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center">
                <Play className="w-5 h-5 fill-white" />
              </div>
              <div className="text-left">
                <div className="text-sm text-white/75">{t(lang, 'continue')}</div>
                <div className="font-bold text-lg">{t(lang, 'level')} {continueLevel}</div>
              </div>
            </div>
            <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <Sparkles className="w-5 h-5 text-white/90" />
            </motion.div>
          </motion.div>
        </Link>

        {/* Logic mode */}
        <Link
          to="/logic"
          onClick={() => { vibrate(15); playClick(); }}
          className="block w-full mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 shadow-xl shadow-cyan-600/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center text-xl">🧩</div>
              <div className="text-left">
                <div className="text-sm text-white/75">{t(lang, 'picturePuzzles')}</div>
                <div className="font-bold text-lg">{t(lang, 'logicMode')}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-white/90 text-sm font-semibold">
              <Flame className="w-4 h-4" /> {logicStats.best}
              <Sparkles className="w-5 h-5 ml-1" />
            </div>
          </motion.div>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { value: completedCount, label: t(lang, 'completed'), icon: Trophy, cls: 'text-indigo-300' },
            { value: totalStars, label: t(lang, 'stars'), icon: Star, cls: 'text-amber-300' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center"
            >
              <div className={`text-2xl font-bold flex items-center justify-center gap-1.5 ${s.cls}`}>
                <s.icon className="w-5 h-5" />{s.value}
              </div>
              <div className="text-xs text-white/50 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Badges */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Medal className="w-4 h-4 text-amber-300" />
            <h2 className="text-sm font-semibold text-white/80">{t(lang, 'badges')}</h2>
            <div className="flex-1 h-px bg-white/10" />
            <Link
              to="/achievements"
              onClick={() => { vibrate(10); playClick(); }}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 shrink-0"
            >
              {t(lang, 'viewAll')}
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[...BADGES, ...STAGE_BADGES].map((b) => {
              const earned = progress.badges && progress.badges[b.id];
              const name = b.stage ? t(lang, b.stage) : t(lang, `badge_${b.id}`);
              const desc = b.stage
                ? t(lang, 'stageBadgeDesc').replace('{stage}', t(lang, b.stage))
                : t(lang, `badge_${b.id}_desc`);
              return (
                <motion.div
                  key={b.id}
                  whileHover={{ scale: earned ? 1.06 : 1 }}
                  className={`shrink-0 w-28 rounded-2xl p-3 text-center border ${
                    earned
                      ? 'bg-gradient-to-br from-amber-400/20 to-orange-500/10 border-amber-400/40 shadow-lg shadow-amber-500/10'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <motion.div
                    animate={earned ? { y: [0, -3, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 2.4 }}
                    className={`text-2xl ${earned ? '' : 'grayscale opacity-30'}`}
                  >
                    {b.emoji}
                  </motion.div>
                  <div className={`text-xs font-semibold mt-1 ${earned ? 'text-amber-200' : 'text-white/40'}`}>{name}</div>
                  <div className="text-[10px] text-white/40 mt-0.5 leading-tight">{desc}</div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-8">
          {STAGES.filter((stage) => progress.unlockedUpTo >= stage.range[0]).map((stage) => {
            const levels = [];
            for (let i = stage.range[0]; i <= Math.min(stage.range[1], progress.unlockedUpTo); i++) levels.push(i);
            return (
              <motion.section
                key={stage.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${stage.gradient}`} />
                  <span className={`text-xs font-semibold ${stage.text}`}>{stage.icon} {t(lang, stage.id)}</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
                  {levels.map((level, i) => (
                    <LevelButton key={level} level={level} stage={stage} progress={progress} index={i} />
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>
      </div>
    </div>
  );
}