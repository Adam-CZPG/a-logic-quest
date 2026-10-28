import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowLeft, Flame, Sparkles, Volume2, VolumeX, Check } from 'lucide-react';
import { generateLogicPuzzle, getLogicStats, saveLogicStats } from '@/lib/logicEngine';
import { isSoundOn, toggleSound, vibrate, playTap, playWin, playClick, playBlock } from '@/lib/sfx';
import { getLang, t } from '@/lib/i18n';

export default function LogicGame() {
  const [round, setRound] = useState(1);
  const [puzzle, setPuzzle] = useState(() => generateLogicPuzzle(1, getLang()));
  const [picked, setPicked] = useState(null); // { index, correct }
  const [shakeKey, setShakeKey] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sound, setSound] = useState(() => isSoundOn());
  const [stats, setStats] = useState(() => getLogicStats());
  const lang = getLang();

  function nextPuzzle(nextRound) {
    setRound(nextRound);
    setPuzzle(generateLogicPuzzle(nextRound, lang));
    setPicked(null);
  }

  function handlePick(index) {
    if (picked) return;
    const correct = index === puzzle.answerIndex;
    setPicked({ index, correct });
    if (correct) {
      playWin();
      vibrate([40, 60, 80]);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 }, colors: ['#22d3ee', '#3b82f6', '#a78bfa'] });
      const newStreak = streak + 1;
      setStreak(newStreak);
      const newStats = { best: Math.max(stats.best, newStreak), solved: stats.solved + 1 };
      setStats(newStats);
      saveLogicStats(newStats);
      setTimeout(() => nextPuzzle(round + 1), 900);
    } else {
      playBlock();
      vibrate([60, 40, 60]);
      setShakeKey((k) => k + 1);
      setStreak(0);
      setTimeout(() => setPicked(null), 800);
    }
  }

  function handleSoundToggle() {
    const next = toggleSound();
    setSound(next);
    if (next) playClick();
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-4 py-4 max-w-xl mx-auto w-full">
        <Link
          to="/"
          onClick={() => { vibrate(10); playClick(); }}
          className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <div className="font-bold text-lg">🧩 {t(lang, 'logicMode')}</div>
          <div className="text-xs text-white/50">{t(lang, 'puzzleRound')} #{round}</div>
        </div>
        <button
          onClick={handleSoundToggle}
          className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition"
        >
          {sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-white/40" />}
        </button>
      </div>

      {/* Streak */}
      <div className="relative flex justify-center mb-4">
        <motion.div
          key={streak}
          initial={{ scale: 0.7 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm font-bold ${
            streak > 0 ? 'bg-orange-500/20 border-orange-400/40 text-orange-300' : 'bg-white/5 border-white/10 text-white/40'
          }`}
        >
          <Flame className="w-4 h-4" /> {t(lang, 'streak')}: {streak}
        </motion.div>
      </div>

      <div className="relative max-w-xl mx-auto w-full px-4 pb-10">
        {/* Puzzle card */}
        <motion.div
          key={shakeKey}
          animate={shakeKey ? { x: [0, -8, 8, -4, 0] } : {}}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-white/15 bg-white/5 p-6 mb-6 relative overflow-hidden"
        >
          <motion.div
            animate={{ opacity: [0.25, 0.1, 0.25] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 opacity-10"
          />
          {puzzle.type === 'word' || puzzle.type === 'geo' ? (
            <div className="relative text-center text-lg font-semibold leading-relaxed text-white/90">
              {puzzle.shown ? (
                <div className="text-6xl mb-3">{puzzle.shown}</div>
              ) : (
                <span className="mr-1.5">{puzzle.type === 'geo' ? '🌍' : '📐'}</span>
              )}
              {puzzle.prompt}
            </div>
          ) : (
            <>
              <div className="relative flex items-center justify-center gap-2 text-white/70 text-sm mb-4">
                <Sparkles className="w-4 h-4" /> {t(lang, puzzle.promptKey)}
              </div>
              <div className="relative flex flex-wrap justify-center items-center gap-2.5">
            <AnimatePresence mode="popLayout">
              {puzzle.type === 'odd'
                ? puzzle.shown.map((e, i) => (
                    <motion.div
                      key={`${round}-s${i}`}
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 18 }}
                      className="w-14 h-14 rounded-2xl bg-white text-slate-900 text-3xl flex items-center justify-center shadow-lg"
                    >
                      {e}
                    </motion.div>
                  ))
                : [
                    ...puzzle.shown.map((e, i) => (
                      <motion.div
                        key={`${round}-s${i}`}
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 18 }}
                        className={`px-3 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ${
                          puzzle.type === 'count' ? 'bg-white text-slate-900 tracking-tight' : 'bg-white text-slate-900 text-3xl'
                        }`}
                      >
                        {e}
                      </motion.div>
                    )),
                    <motion.div
                      key={`${round}-q`}
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ delay: puzzle.shown.length * 0.06, repeat: Infinity, duration: 1.6 }}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-3xl font-extrabold flex items-center justify-center shadow-lg shadow-cyan-500/40"
                    >
                      ?
                    </motion.div>,
                  ]}
            </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          {puzzle.options.map((opt, i) => {
            const isPicked = picked && picked.index === i;
            const isAnswer = picked && picked.correct && picked.index === i;
            const isWrong = picked && !picked.correct && picked.index === i;
            return (
              <motion.button
                key={`${round}-o${i}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                whileTap={picked ? undefined : { scale: 0.92 }}
                onClick={() => handlePick(i)}
                disabled={!!picked}
                className={`h-20 rounded-2xl flex items-center justify-center text-3xl border transition-colors ${
                  isAnswer
                    ? 'bg-emerald-500/25 border-emerald-400/60 shadow-lg shadow-emerald-500/30'
                    : isWrong
                      ? 'bg-red-500/25 border-red-400/60'
                      : 'bg-white/10 border-white/15 hover:bg-white/15'
                }`}
              >
                <span className="truncate px-2" style={{ fontSize: opt.length > 3 ? '1.1rem' : undefined }}>{opt}</span>
                {isAnswer && <Check className="w-6 h-6 text-emerald-300 ml-2 shrink-0" />}
              </motion.button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-8">
          {[
            { value: stats.solved, label: t(lang, 'solved') },
            { value: stats.best, label: t(lang, 'bestStreak') },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="text-2xl font-bold text-cyan-300">{s.value}</div>
              <div className="text-xs text-white/50 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}