import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Star, Gem, Flame, Medal } from 'lucide-react';
import { TOTAL_LEVELS } from '@/lib/gameEngine';
import { getProgress, BADGES, STAGE_BADGES } from '@/lib/progress';
import { getLogicStats } from '@/lib/logicEngine';
import { vibrate, playClick } from '@/lib/sfx';
import { getLang, t } from '@/lib/i18n';

export default function Achievements() {
  const [progress] = useState(() => getProgress());
  const [logicStats] = useState(() => getLogicStats());
  const lang = getLang();

  const allBadges = [...BADGES, ...STAGE_BADGES];
  // Stage badges are not stored when earned, so evaluate them live as well
  const isEarned = (b) => Boolean((progress.badges && progress.badges[b.id]) || b.check(progress));

  const completedCount = Object.keys(progress.completed).length;
  const totalStars = Object.values(progress.completed).reduce((a, b) => a + b, 0);
  const perfectCount = Object.values(progress.completed).filter((s) => s === 3).length;
  const earnedCount = allBadges.filter(isEarned).length;

  const stats = [
    { value: `${completedCount}/${TOTAL_LEVELS}`, label: t(lang, 'levelsDone'), icon: Trophy, cls: 'text-indigo-300' },
    { value: totalStars, label: t(lang, 'totalStars'), icon: Star, cls: 'text-amber-300' },
    { value: perfectCount, label: t(lang, 'perfectLevels'), icon: Gem, cls: 'text-rose-300' },
    { value: logicStats.best || 0, label: t(lang, 'logicBest'), icon: Flame, cls: 'text-cyan-300' },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-4 py-8 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/games"
            onClick={() => { vibrate(10); playClick(); }}
            className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition"
            aria-label={t(lang, 'home')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight">{t(lang, 'achievements')}</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i }}
              className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center"
            >
              <div className={`text-2xl font-bold flex items-center justify-center gap-1.5 ${s.cls}`}>
                <s.icon className="w-5 h-5" />{s.value}
              </div>
              <div className="text-xs text-white/50 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Medal className="w-4 h-4 text-amber-300" />
          <h2 className="text-sm font-semibold text-white/80">{t(lang, 'badgesEarned')}</h2>
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs font-semibold text-amber-300">{earnedCount}/{allBadges.length}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allBadges.map((b, i) => {
            const earned = isEarned(b);
            const name = b.stage ? t(lang, b.stage) : t(lang, `badge_${b.id}`);
            const desc = b.stage
              ? t(lang, 'stageBadgeDesc').replace('{stage}', t(lang, b.stage))
              : t(lang, `badge_${b.id}_desc`);
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.03 * i }}
                className={`rounded-2xl p-4 text-center border ${
                  earned
                    ? 'bg-gradient-to-br from-amber-400/20 to-orange-500/10 border-amber-400/40 shadow-lg shadow-amber-500/10'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className={`text-3xl ${earned ? '' : 'grayscale opacity-30'}`}>{b.emoji}</div>
                <div className={`text-sm font-semibold mt-2 ${earned ? 'text-amber-200' : 'text-white/40'}`}>{name}</div>
                <div className="text-[11px] text-white/40 mt-1 leading-tight">{desc}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
