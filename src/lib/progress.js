import { TOTAL_LEVELS } from './gameEngine';

const KEY = 'mathpuzzle_progress_v1';

export const BADGES = [
  { id: 'first_win', emoji: '🏆', name: 'First Victory', desc: 'Complete your first level', check: (p) => Object.keys(p.completed).length >= 1 },
  { id: 'rising_star', emoji: '🌟', name: 'Rising Star', desc: 'Complete 5 levels', check: (p) => Object.keys(p.completed).length >= 5 },
  { id: 'puzzle_pro', emoji: '⚡', name: 'Puzzle Pro', desc: 'Complete 15 levels', check: (p) => Object.keys(p.completed).length >= 15 },
  { id: 'star_collector', emoji: '✨', name: 'Star Collector', desc: 'Earn 30 stars', check: (p) => Object.values(p.completed).reduce((a, b) => a + b, 0) >= 30 },
  { id: 'perfectionist', emoji: '💎', name: 'Perfectionist', desc: 'Get 3 stars on 5 levels', check: (p) => Object.values(p.completed).filter((s) => s === 3).length >= 5 },
];

// Difficulty-stage badges — one per stage (Beginner..Master), earned by completing
// every level in that stage's range.
export const STAGE_BADGES = [
  { id: 'stage_beginner', stage: 'beginner', emoji: '🌱', range: [1, 15] },
  { id: 'stage_easy', stage: 'easy', emoji: '⭐', range: [16, 30] },
  { id: 'stage_medium', stage: 'medium', emoji: '⚡', range: [31, 50] },
  { id: 'stage_hard', stage: 'hard', emoji: '🔥', range: [51, 70] },
  { id: 'stage_expert', stage: 'expert', emoji: '💎', range: [71, 90] },
  { id: 'stage_master', stage: 'master', emoji: '👑', range: [91, 120] },
].map((s) => ({
  ...s,
  check: (p) => {
    let done = 0;
    for (let i = s.range[0]; i <= s.range[1]; i++) if (p.completed[i]) done++;
    return done === s.range[1] - s.range[0] + 1;
  },
}));

export function getProgress() {
  const fresh = { unlockedUpTo: 1, completed: {}, badges: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh;
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object') return fresh;
    // Self-heal: guarantee every field the app relies on always exists
    if (!Number.isFinite(p.unlockedUpTo) || p.unlockedUpTo < 1) p.unlockedUpTo = 1;
    if (!p.completed || typeof p.completed !== 'object' || Array.isArray(p.completed)) p.completed = {};
    if (!p.badges || typeof p.badges !== 'object' || Array.isArray(p.badges)) p.badges = {};
    return p;
  } catch {
    return fresh;
  }
}

export function saveProgress(p) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Storage full or unavailable — never crash the game on a failed save
  }
}

export function completeLevel(level, stars) {
  const p = getProgress();
  p.completed[level] = Math.max(p.completed[level] || 0, stars);
  if (level >= p.unlockedUpTo && level < TOTAL_LEVELS) {
    p.unlockedUpTo = Math.max(p.unlockedUpTo, level + 1);
  }
  if (!p.badges) p.badges = {};
  BADGES.forEach((b) => {
    if (!p.badges[b.id] && b.check(p)) p.badges[b.id] = true;
  });
  saveProgress(p);
  return p;
}

export function isUnlocked(level, p) {
  return level <= p.unlockedUpTo;
}