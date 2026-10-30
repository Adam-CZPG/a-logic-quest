import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowLeft, Undo2, RotateCcw, RefreshCw, Star, Check, Target, Volume2, VolumeX, Flame, Timer } from 'lucide-react';
import { TOTAL_LEVELS, generateLevel, evaluate } from '@/lib/gameEngine';
import { getProgress, completeLevel, isUnlocked } from '@/lib/progress';
import { isSoundOn, toggleSound, vibrate, playTap, playUndo, playClear, playWin, playBlock, playClick, playTimeUp } from '@/lib/sfx';
import { getLang, t } from '@/lib/i18n';

const STAGE_STYLES = {
  beginner: { emoji: '🌱', gradient: 'from-emerald-400 to-teal-500', chip: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' },
  easy: { emoji: '⭐', gradient: 'from-sky-400 to-blue-500', chip: 'bg-sky-400/20 text-sky-300 border-sky-400/30' },
  medium: { emoji: '⚡', gradient: 'from-violet-400 to-purple-500', chip: 'bg-violet-400/20 text-violet-300 border-violet-400/30' },
  hard: { emoji: '🔥', gradient: 'from-amber-400 to-orange-500', chip: 'bg-amber-400/20 text-amber-300 border-amber-400/30' },
  expert: { emoji: '💎', gradient: 'from-rose-400 to-pink-500', chip: 'bg-rose-400/20 text-rose-300 border-rose-400/30' },
  master: { emoji: '👑', gradient: 'from-fuchsia-500 to-red-500', chip: 'bg-fuchsia-400/20 text-fuchsia-300 border-fuchsia-400/30' },
};

export default function Game() {
  const { level } = useParams();
  const levelNum = parseInt(level, 10);

  const progress = useMemo(() => getProgress(), [level]);

  if (!levelNum || levelNum < 1 || levelNum > TOTAL_LEVELS) return <Navigate to="/games" replace />;
  if (!isUnlocked(levelNum, progress)) return <Navigate to="/games" replace />;

  return <GameBoard levelNum={levelNum} />;
}

function GameBoard({ levelNum }) {
  const [puzzle, setPuzzle] = useState(() => generateLevel(levelNum));
  const [expression, setExpression] = useState([]);
  const [usedIds, setUsedIds] = useState(() => new Set());
  const [status, setStatus] = useState('playing');
  const [stars, setStars] = useState(0);
  const [remaining, setRemaining] = useState(puzzle.timeLimit);
  const [shake, setShake] = useState(0);
  const [sound, setSound] = useState(() => isSoundOn());
  const [intro, setIntro] = useState(true);
  const startTime = useRef(Date.now());

  const stage = STAGE_STYLES[puzzle.stage] || STAGE_STYLES.beginner;
  const lang = getLang();
  const urgent = remaining <= 10 && status === 'playing';

  // Reset when level changes
  useEffect(() => {
    const p = generateLevel(levelNum);
    setPuzzle(p);
    setExpression([]);
    setUsedIds(new Set());
    setStatus('playing');
    setStars(0);
    setRemaining(p.timeLimit);
    startTime.current = Date.now();
  }, [levelNum]);

  // Intro overlay per puzzle
  useEffect(() => {
    setIntro(true);
    const t = setTimeout(() => setIntro(false), 1200);
    return () => clearTimeout(t);
  }, [puzzle]);

  // Countdown
  useEffect(() => {
    if (status !== 'playing') return;
    const id = setInterval(() => {
      setRemaining((r) => (r - 0.1 < 0 ? 0 : r - 0.1));
    }, 100);
    return () => clearInterval(id);
  }, [status, puzzle]);

  // Fail on timeout
  useEffect(() => {
    if (status !== 'playing') return;
    if (remaining <= 0) {
      setStatus('failed');
      vibrate([80, 60, 80, 60, 200]);
      playTimeUp();
    }
  }, [remaining, status]);

  const exprValues = expression.map((t) => t.value);
  const endsWithNum = expression.length > 0 && expression[expression.length - 1].type === 'num';
  const current = endsWithNum ? evaluate(exprValues) : null;
  const allUsed = expression.length === puzzle.tiles.length;
  const solved = current !== null && current === puzzle.target && allUsed;

  // Win detection
  useEffect(() => {
    if (status !== 'playing') return;
    if (solved) {
      const t = (Date.now() - startTime.current) / 1000;
      const earned = t < 40 ? 3 : t < 90 ? 2 : 1;
      setStars(earned);
      setStatus('won');
      completeLevel(levelNum, earned);
      vibrate([40, 60, 40, 60, 80]);
      playWin();
      confetti({ particleCount: 140, spread: 75, origin: { y: 0.55 }, colors: ['#a78bfa', '#fbbf24', '#34d399', '#60a5fa'] });
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } }), 250);
    }
  }, [expression]);

  function placeTile(tile) {
    if (status !== 'playing' || usedIds.has(tile.id)) return;
    let valid = true;
    if (expression.length === 0) {
      valid = tile.type === 'num';
    } else {
      const last = expression[expression.length - 1];
      valid = last.type === 'num' ? tile.type === 'op' : tile.type === 'num';
    }
    if (!valid) {
      playBlock();
      vibrate(20);
      setShake((s) => s + 1);
      return;
    }
    playTap(expression.length);
    vibrate(12);
    setExpression((prev) => [...prev, tile]);
    setUsedIds((prev) => new Set([...prev, tile.id]));
  }

  function undo() {
    if (status !== 'playing' || expression.length === 0) return;
    playUndo();
    vibrate(8);
    setExpression((prev) => {
      const next = prev.slice(0, -1);
      setUsedIds(new Set(next.map((t) => t.id)));
      return next;
    });
  }

  function clearAll() {
    if (status !== 'playing') return;
    playClear();
    vibrate([10, 30, 10]);
    setExpression([]);
    setUsedIds(new Set());
  }

  function retry() {
    const p = generateLevel(levelNum);
    setPuzzle(p);
    setExpression([]);
    setUsedIds(new Set());
    setStatus('playing');
    setStars(0);
    setRemaining(p.timeLimit);
    startTime.current = Date.now();
  }

  function handleSoundToggle() {
    const next = toggleSound();
    setSound(next);
    if (next) playClick();
  }

  const valueColor =
    solved ? 'text-emerald-300'
    : current !== null && current === puzzle.target ? 'text-amber-300'
    : 'text-white';

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col overflow-hidden">
      {/* Floating glow orbs */}
      <div className={`pointer-events-none absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl ${stage.gradient} opacity-15 bg-gradient-to-br`} />
      <div className="pointer-events-none absolute bottom-0 -right-24 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl" />

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-4 py-4 max-w-xl mx-auto w-full">
        <Link
          to="/games"
          onClick={() => { vibrate(10); playClick(); }}
          className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${stage.chip}`}>
            {stage.emoji} {t(lang, puzzle.stage)}
          </span>
          <div className="font-bold text-lg mt-0.5">{t(lang, 'level')} {levelNum}</div>
        </div>
        <button
          onClick={handleSoundToggle}
          className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition"
        >
          {sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-white/40" />}
        </button>
      </div>

      {/* Timer bar */}
      <div className="relative max-w-xl mx-auto w-full px-4 mb-2">
        <div className="flex items-center gap-2 mb-1">
          <Timer className={`w-4 h-4 ${urgent ? 'text-red-400' : 'text-white/50'}`} />
          <motion.span
            animate={urgent ? { scale: [1, 1.15, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.7 }}
            className={`text-sm font-bold tabular-nums ${urgent ? 'text-red-400' : 'text-white/70'}`}
          >
            {Math.ceil(remaining)}s
          </motion.span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-100 ease-linear ${urgent ? 'bg-gradient-to-r from-red-500 to-orange-500' : `bg-gradient-to-r ${stage.gradient}`}`}
            style={{ width: `${(remaining / puzzle.timeLimit) * 100}%` }}
          />
        </div>
      </div>

      <div className="relative max-w-xl mx-auto w-full px-4 flex-1 flex flex-col">
        {/* Target */}
        <motion.div
          key={puzzle.target}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="mt-2 mb-5 rounded-3xl border border-white/15 p-6 text-center relative overflow-hidden bg-white/5"
        >
          <motion.div
            animate={{ opacity: [0.3, 0.12, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className={`absolute inset-0 bg-gradient-to-br ${stage.gradient} opacity-20`}
          />
          <div className="relative flex items-center justify-center gap-2 text-white/70 text-sm mb-1">
            <Target className="w-4 h-4" /> {t(lang, 'target')}
          </div>
          <div className="relative text-6xl font-extrabold tracking-tight drop-shadow-lg">
            {puzzle.target}
          </div>
        </motion.div>

        {/* Expression display */}
        <motion.div
          key={shake}
          animate={shake ? { x: [0, -6, 6, -3, 0] } : {}}
          transition={{ duration: 0.3 }}
          className="rounded-3xl bg-white/5 border border-white/10 p-5 mb-5 min-h-[120px] flex flex-col"
        >
          <div className="flex flex-wrap items-center justify-center gap-2 flex-1">
            <AnimatePresence mode="popLayout">
              {expression.length === 0 ? (
                <motion.span
                  key="empty"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-white/40 text-sm"
                >
                  {t(lang, 'tapToBuild')}
                </motion.span>
              ) : (
                expression.map((t) => (
                  <motion.span
                    key={t.id}
                    layout
                    initial={{ scale: 0.4, opacity: 0, y: 16, rotate: -8 }}
                    animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                    exit={{ scale: 0.4, opacity: 0, y: -12 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                    className={`px-3 py-2 rounded-xl text-2xl font-bold shadow-lg ${
                      t.type === 'op' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900' : 'bg-white text-slate-900'
                    }`}
                  >
                    {t.value}
                  </motion.span>
                ))
              )}
            </AnimatePresence>
          </div>
          <div className="text-center mt-3 pt-3 border-t border-white/10">
            <span className="text-white/40 text-sm">= </span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={current === null ? 'none' : current}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className={`inline-block text-3xl font-extrabold tabular-nums ${valueColor}`}
              >
                {current === null ? '—' : current}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Tile pool */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {puzzle.tiles.map((tile) => {
            const used = usedIds.has(tile.id);
            return (
              <motion.button
                key={tile.id}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: used ? 0.95 : 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                whileTap={used ? undefined : { scale: 0.85 }}
                onClick={() => placeTile(tile)}
                disabled={used}
                className={`w-16 h-16 rounded-2xl text-3xl font-extrabold flex items-center justify-center transition-opacity
                  ${tile.type === 'op'
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 shadow-lg shadow-orange-500/40'
                    : 'bg-gradient-to-br from-white to-slate-200 text-slate-900 shadow-lg shadow-black/30'}
                  ${used ? 'opacity-20 pointer-events-none' : 'hover:brightness-110'}`}
              >
                {tile.value}
              </motion.button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Undo2, label: t(lang, 'undo'), fn: undo, disabled: expression.length === 0 || status !== 'playing' },
            { icon: RotateCcw, label: t(lang, 'clear'), fn: clearAll, disabled: expression.length === 0 || status !== 'playing' },
            { icon: RefreshCw, label: t(lang, 'newPuzzle'), fn: retry, disabled: false },
          ].map((c) => (
            <motion.button
              key={c.label}
              whileTap={{ scale: 0.95 }}
              onClick={c.fn}
              disabled={c.disabled}
              className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 transition"
            >
              <c.icon className="w-5 h-5" />
              <span className="text-xs">{c.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Win modal */}
      <AnimatePresence>
        {status === 'won' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
          >
            <motion.div
              initial={{ scale: 0.7, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.7, y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 16 }}
              className="w-full max-w-sm rounded-3xl bg-gradient-to-br from-slate-800 to-indigo-950 border border-white/15 p-8 text-center relative overflow-hidden"
            >
              {levelNum < TOTAL_LEVELS && (
                <div className="overflow-hidden rounded-full bg-white/10 border border-white/10 py-1.5 mb-4">
                  <motion.div
                    animate={{ x: [-160, 160] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                    className="whitespace-nowrap text-sm font-extrabold tracking-widest bg-gradient-to-r from-transparent via-amber-300 to-transparent bg-clip-text text-transparent"
                  >
                    ★ LEVEL UP ★ LEVEL UP ★ LEVEL UP ★
                  </motion.div>
                </div>
              )}
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="inline-flex w-16 h-16 rounded-full bg-emerald-500/20 items-center justify-center mb-4"
              >
                <Check className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <h2 className="text-2xl font-extrabold mb-1">{t(lang, 'levelComplete')}</h2>
              <p className="text-white/50 text-sm mb-5 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-amber-400" /> {t(lang, 'solvedIn').replace('{sec}', Math.floor((Date.now() - startTime.current) / 1000))}
              </p>
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                  <motion.div
                    key={s}
                    initial={{ scale: 0, rotate: -40 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15 * s + 0.2, type: 'spring', damping: 12 }}
                  >
                    <motion.div
                      animate={s <= stars ? { y: [0, -6, 0] } : {}}
                      transition={{ repeat: Infinity, duration: 1.6, delay: s * 0.2 }}
                    >
                      <Star className={`w-10 h-10 ${s <= stars ? 'fill-amber-300 text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.6)]' : 'text-white/20'}`} />
                    </motion.div>
                  </motion.div>
                ))}
              </div>
              <div className="flex gap-3">
                <Link
                  to="/games"
                  onClick={playClick}
                  className="flex-1 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 font-semibold transition"
                >
                  {t(lang, 'home')}
                </Link>
                {levelNum < TOTAL_LEVELS ? (
                  <Link
                    to={`/game/${levelNum + 1}`}
                    onClick={playClick}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold shadow-lg shadow-violet-600/30 hover:shadow-violet-500/50 transition"
                  >
                    {t(lang, 'next')}
                  </Link>
                ) : (
                  <Link
                    to="/games"
                    onClick={playClick}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold transition"
                  >
                    {t(lang, 'allDone')}
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fail modal */}
      <AnimatePresence>
        {status === 'failed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
          >
            <motion.div
              initial={{ scale: 0.7, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.7, y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 16 }}
              className="w-full max-w-sm rounded-3xl bg-gradient-to-br from-slate-800 to-red-950 border border-red-400/30 p-8 text-center"
            >
              <motion.div
                animate={{ rotate: [0, -14, 12, -8, 6, 0], scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="inline-flex w-16 h-16 rounded-full bg-red-500/20 items-center justify-center mb-4 text-4xl"
              >
                ⏰
              </motion.div>
              <h2 className="text-2xl font-extrabold mb-1 text-red-300">{t(lang, 'timesUp')}</h2>
              <p className="text-white/50 text-sm mb-6">{t(lang, 'timesUpDesc')}</p>
              <div className="flex gap-3">
                <Link
                  to="/games"
                  onClick={playClick}
                  className="flex-1 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 font-semibold transition"
                >
                  {t(lang, 'home')}
                </Link>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={retry}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 font-semibold shadow-lg shadow-red-500/30 transition"
                >
                  {t(lang, 'retry')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level intro overlay */}
      <AnimatePresence>
        {intro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
              className={`px-5 py-2 rounded-full border text-sm font-semibold ${stage.chip}`}
            >
              {stage.emoji} {t(lang, puzzle.stage)}
            </motion.div>
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: 'spring', damping: 12 }}
              className="text-7xl font-extrabold mt-3 bg-gradient-to-r from-white to-violet-300 bg-clip-text text-transparent"
            >
              {t(lang, 'level')} {levelNum}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="text-white/50 mt-2 text-sm"
            >
              {t(lang, 'target')}: {puzzle.target} · {puzzle.timeLimit}s
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}