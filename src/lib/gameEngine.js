export const TOTAL_LEVELS = 120;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function divisors(n) {
  const d = [];
  const abs = Math.abs(n);
  for (let i = 1; i <= abs; i++) if (abs % i === 0) d.push(i);
  return d;
}

export function getDifficulty(level) {
  if (level <= 15) return { numCount: 3, maxNum: 9, ops: ['+', '-'], stage: 'beginner', timeLimit: 60 };
  if (level <= 30) return { numCount: 3, maxNum: 12, ops: ['+', '-', '×'], stage: 'easy', timeLimit: 60 };
  if (level <= 50) return { numCount: 4, maxNum: 15, ops: ['+', '-', '×'], stage: 'medium', timeLimit: 75 };
  if (level <= 70) return { numCount: 4, maxNum: 20, ops: ['+', '-', '×', '÷'], stage: 'hard', timeLimit: 90 };
  if (level <= 90) return { numCount: 5, maxNum: 25, ops: ['+', '-', '×', '÷'], stage: 'expert', timeLimit: 120 };
  return { numCount: 5, maxNum: 50, ops: ['+', '-', '×', '÷'], stage: 'master', timeLimit: 150 };
}

// Left-to-right evaluation. Returns number or null if invalid (bad shape, /0, non-integer division).
export function evaluate(values) {
  if (!values || values.length === 0) return null;
  if (values.length % 2 === 0) return null;
  let val = parseFloat(values[0]);
  if (isNaN(val)) return null;
  for (let i = 1; i < values.length; i += 2) {
    const op = values[i];
    const num = parseFloat(values[i + 1]);
    if (isNaN(num)) return null;
    if (op === '+') val = val + num;
    else if (op === '-') val = val - num;
    else if (op === '×') val = val * num;
    else if (op === '÷') {
      if (num === 0) return null;
      if (val % num !== 0) return null;
      val = val / num;
    } else return null;
  }
  return val;
}

export function generateLevel(level) {
  const base = getDifficulty(level);
  for (let pass = 0; pass < 2; pass++) {
    const cfg = pass === 0 ? base : { ...base, ops: base.ops.filter((o) => o !== '÷') };
    for (let attempt = 0; attempt < 500; attempt++) {
      let val = randInt(1, cfg.maxNum);
      const nums = [val];
      const ops = [];
      let ok = true;
      for (let i = 0; i < cfg.numCount - 1; i++) {
        const op = pick(cfg.ops);
        let num;
        if (op === '÷') {
          const ds = divisors(val).filter((d) => d >= 1 && d <= cfg.maxNum);
          if (ds.length === 0) { ok = false; break; }
          num = pick(ds);
          val = val / num;
        } else if (op === '-') {
          num = randInt(1, cfg.maxNum);
          val = val - num;
        } else if (op === '+') {
          num = randInt(1, cfg.maxNum);
          val = val + num;
        } else {
          num = randInt(1, Math.min(cfg.maxNum, 9));
          val = val * num;
        }
        nums.push(num);
        ops.push(op);
        if (val < 0) { ok = false; break; }
      }
      if (!ok) continue;
      if (val < 0 || val > 999) continue;
      const target = val;
      const tilesRaw = [];
      nums.forEach((n) => tilesRaw.push({ value: String(n), type: 'num' }));
      ops.forEach((o) => tilesRaw.push({ value: o, type: 'op' }));
      const shuffled = shuffle(tilesRaw);
      const tiles = shuffled.map((t, idx) => ({ id: `${level}-${attempt}-${idx}`, ...t }));
      return { level, target, tiles, numCount: cfg.numCount, stage: base.stage, timeLimit: base.timeLimit };
    }
  }
  const a = randInt(1, 9), b = randInt(1, 9);
  const tiles = shuffle([
    { value: String(a), type: 'num' },
    { value: '+', type: 'op' },
    { value: String(b), type: 'num' },
  ]).map((t, idx) => ({ id: `f${idx}`, ...t }));
  return { level, target: a + b, tiles, numCount: 2, stage: base.stage, timeLimit: base.timeLimit };
}