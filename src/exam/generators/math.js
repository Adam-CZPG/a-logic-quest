// Maths question generators. Every answer is computed, never typed by hand,
// so generated questions are always correct. Text comes from i18n keys `m.*`,
// which makes maths work in every interface language.
//
// Each generator: (r, ctx) => question
//   r   – seeded rng (see rng.js)
//   ctx – { grade, lang, t, f, names, cur, points, hard }

import { gcd, lcm } from '../rng';

const MINUS = '−';
const sgn = (n) => (n < 0 ? `(${MINUS}${Math.abs(n)})` : `${n}`);
const neg = (s) => String(s).replace(/-/g, MINUS);

function choice(r, correct, distractors, extra = {}) {
  const seen = new Set([JSON.stringify(correct)]);
  const ds = [];
  for (const d of distractors) {
    const k = JSON.stringify(d);
    if (!seen.has(k)) {
      seen.add(k);
      ds.push(d);
    }
    if (ds.length === (extra.count ?? 4) - 1) break;
  }
  const options = r.shuffle([correct, ...ds]);
  return { type: 'choice', options, answer: options.findIndex((o) => JSON.stringify(o) === JSON.stringify(correct)) };
}

function frac(n, d) {
  const g = gcd(n, d);
  n /= g;
  d /= g;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  return { n, d, value: n / d, str: d === 1 ? `${n}` : `${n}/${d}` };
}

function digitsStr(digits) {
  return digits.join(', ');
}

// ---------------------------------------------------------------- číslo a početní operace
const cislo = {
  orderOfOps(r, ctx) {
    const { f } = ctx;
    const g = ctx.grade;
    const forms = [
      () => {
        const a = r.int(10, 90), b = r.int(2, 9), c = r.int(2, 9);
        return { expr: `${a} + ${b} × ${c}`, v: a + b * c, why: `${b} × ${c} = ${b * c}; ${a} + ${b * c} = ${a + b * c}` };
      },
      () => {
        const b = r.int(2, 9), c = r.int(2, 9), a = b + r.int(3, 20);
        return { expr: `(${a} ${MINUS} ${b}) × ${c}`, v: (a - b) * c, why: `${a} ${MINUS} ${b} = ${a - b}; ${a - b} × ${c} = ${(a - b) * c}` };
      },
      () => {
        const d = r.int(2, 9), q = r.int(3, 12), a = r.int(4, 12), b = r.int(2, 9);
        const v = a * b - q;
        if (v < 0) return null;
        return { expr: `${a} × ${b} ${MINUS} ${q * d} : ${d}`, v, why: `${a} × ${b} = ${a * b}; ${q * d} : ${d} = ${q}; ${a * b} ${MINUS} ${q} = ${v}` };
      },
      () => {
        const a = r.int(100, 900), b = r.int(2, 9), c = r.int(10, 60);
        return { expr: `${a} ${MINUS} ${b} × (${c} + ${b})`, v: a - b * (c + b), why: `${c} + ${b} = ${c + b}; ${b} × ${c + b} = ${b * (c + b)}; ${a} ${MINUS} ${b * (c + b)} = ${a - b * (c + b)}` };
      },
    ];
    if (g >= 7) {
      forms.push(() => {
        const a = r.int(2, 9), b = r.int(2, 9), c = r.int(1, 9);
        const v = -a * b + c * 3;
        return { expr: `${MINUS}${a} × ${b} + ${c} × 3`, v, why: neg(`-${a * b} + ${c * 3} = ${v}`) };
      });
    }
    let x = null;
    while (!x || x.v < (g >= 7 ? -999 : 0)) x = r.pick(forms)();
    return { type: 'number', text: ctx.t('m.calc'), expr: x.expr, answer: x.v, explain: neg(x.why) };
  },

  missing(r, ctx) {
    const b = r.int(3, 9), x = r.int(4, 15), c = r.int(1, 30);
    const res = x * b + c;
    return {
      type: 'number', text: ctx.t('m.missing'), expr: `□ × ${b} + ${c} = ${res}`, answer: x,
      explain: `${res} ${MINUS} ${c} = ${res - c}; ${res - c} : ${b} = ${x}`,
    };
  },

  rounding(r, ctx) {
    const n = r.int(1000, 99999);
    const place = r.pick([10, 100, 1000]);
    const key = { 10: 'm.round10', 100: 'm.round100', 1000: 'm.round1000' }[place];
    const ans = Math.round(n / place) * place;
    return { type: 'number', text: ctx.t(key, { n: ctx.f(n) }), answer: ans, explain: `${ctx.f(n)} ≈ ${ctx.f(ans)}` };
  },

  digits(r, ctx) {
    const ds = r.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
    if (!ds.some((d) => d % 2 === 0)) ds[0] = 0;
    const perms = [];
    const rec = (pre, rest) => {
      if (!rest.length) return perms.push(pre);
      rest.forEach((d, i) => rec([...pre, d], rest.filter((_, j) => j !== i)));
    };
    rec([], ds);
    const nums = perms.filter((p) => p[0] !== 0).map((p) => Number(p.join('')));
    const kind = r.pick(['largestEven', 'smallestOdd', 'largest', 'smallest']);
    let pool = nums;
    if (kind === 'largestEven') pool = nums.filter((n) => n % 2 === 0);
    if (kind === 'smallestOdd') pool = nums.filter((n) => n % 2 === 1);
    if (!pool.length) return cislo.digits(r, ctx);
    const ans = kind.startsWith('largest') ? Math.max(...pool) : Math.min(...pool);
    return { type: 'number', text: ctx.t(`m.digits_${kind}`, { d: digitsStr(ds) }), answer: ans, explain: `${ans}` };
  },

  fractions(r, ctx) {
    const op = r.pick(ctx.grade >= 9 ? ['+', '-', '×', ':'] : ['+', '-', '×']);
    const d1 = r.int(2, 9), d2 = r.int(2, 9);
    const n1 = r.int(1, d1 - 1 || 1), n2 = r.int(1, d2 - 1 || 1);
    let res;
    if (op === '+') res = frac(n1 * d2 + n2 * d1, d1 * d2);
    if (op === '-') res = frac(n1 * d2 - n2 * d1, d1 * d2);
    if (op === '×') res = frac(n1 * n2, d1 * d2);
    if (op === ':') res = frac(n1 * d2, d1 * n2);
    const opS = op === '-' ? MINUS : op;
    return {
      type: 'number', text: ctx.t('m.calc_frac'), expr: `${n1}/${d1} ${opS} ${n2}/${d2}`,
      answer: res.value, answerDisplay: neg(res.str), explain: neg(`= ${res.str}`),
    };
  },

  decimals(r, ctx) {
    const { f } = ctx;
    const forms = [
      () => { const a = r.int(11, 99) / 10, b = r.int(2, 9) / 10; return { e: `${f(a)} × ${f(b)}`, v: Math.round(a * b * 100) / 100 }; },
      () => { const b = r.int(2, 9) / 10, q = r.int(2, 15); return { e: `${f(Math.round(b * q * 100) / 100)} : ${f(b)}`, v: q }; },
      () => { const a = r.int(105, 990) / 100, b = r.int(15, 95) / 10; return { e: `${f(a)} + ${f(b)}`, v: Math.round((a + b) * 100) / 100 }; },
      () => { const a = r.int(50, 99) / 10, b = r.int(105, 480) / 100; return { e: `${f(a)} ${MINUS} ${f(b)}`, v: Math.round((a - b) * 100) / 100 }; },
    ];
    const x = r.pick(forms)();
    return { type: 'number', text: ctx.t('m.calc'), expr: x.e, answer: x.v, explain: `${x.e} = ${f(x.v)}` };
  },

  divisibility(r, ctx) {
    const divs = r.sample([2, 3, 4, 5, 6, 9, 10], 4);
    const statements = [];
    const answer = [];
    divs.forEach((d) => {
      const yes = r.chance(0.5);
      let n = yes ? d * r.int(12, 120) : d * r.int(12, 120) + r.int(1, d - 1);
      statements.push(ctx.t('m.divisible', { n: ctx.f(n), d }));
      answer.push(n % d === 0);
    });
    return { type: 'tf', text: ctx.t('m.decide_tf'), statements, answer };
  },

  lcmGcd(r, ctx) {
    const a = r.int(2, 12) * r.pick([1, 2, 3]), b = r.int(2, 12) * r.pick([1, 2]);
    if (a === b) return cislo.lcmGcd(r, ctx);
    if (r.chance(0.5)) {
      return { type: 'number', text: ctx.t('m.lcm', { a, b }), answer: lcm(a, b), explain: `n(${a}, ${b}) = ${lcm(a, b)}` };
    }
    return { type: 'number', text: ctx.t('m.gcd', { a, b }), answer: gcd(a, b), explain: `D(${a}, ${b}) = ${gcd(a, b)}` };
  },

  integers(r, ctx) {
    const a = r.int(-15, 15) || 4, b = r.int(-9, 9) || -3, c = r.int(-6, 6) || 2;
    const v = a - b * c;
    return { type: 'number', text: ctx.t('m.calc'), expr: neg(`${a} ${MINUS} ${sgn(b)} × ${sgn(c)}`), answer: v, explain: neg(`${b} × ${c} = ${b * c}; ${a} - (${b * c}) = ${v}`) };
  },

  powers(r, ctx) {
    const sq = r.pick([16, 25, 36, 49, 64, 81, 100, 121, 144]);
    const a = r.int(2, 5), e = a <= 3 ? r.int(2, 4) : 2, b = r.int(2, 9);
    const sup = { 2: '²', 3: '³', 4: '⁴' }[e];
    const v = a ** e + b * b - Math.sqrt(sq);
    return { type: 'number', text: ctx.t('m.calc'), expr: `${a}${sup} + ${b}² ${MINUS} √${sq}`, answer: v, explain: `${a ** e} + ${b * b} ${MINUS} ${Math.sqrt(sq)} = ${v}` };
  },
};

// ---------------------------------------------------------------- slovní úlohy
const slovni = {
  shopping(r, ctx) {
    const n = r.int(5, 9), p = r.int(8, 45), bill = n * p < 100 ? 100 : n * p < 200 ? 200 : n * p < 500 ? 500 : 1000;
    const ans = bill - n * p;
    return {
      type: 'number', unit: ctx.cur, answer: ans,
      text: ctx.t('m.w_shop', { name: r.pick(ctx.names), n, p, bill, cur: ctx.cur }),
      explain: `${n} × ${p} = ${n * p}; ${bill} ${MINUS} ${n * p} = ${ans}`,
    };
  },
  unitPrice(r, ctx) {
    const unit = r.int(3, 15), n = r.int(5, 9), m = r.int(5, 14);
    if (m === n) return slovni.unitPrice(r, ctx);
    return {
      type: 'number', unit: ctx.cur, answer: unit * m,
      text: ctx.t('m.w_unit', { n, c: unit * n, m, cur: ctx.cur }),
      explain: `${unit * n} : ${n} = ${unit}; ${unit} × ${m} = ${unit * m}`,
    };
  },
  ageTimes(r, ctx) {
    const son = r.int(6, 14), k = r.int(3, 5);
    const total = son * (k + 1);
    return {
      type: 'number', answer: son, text: ctx.t('m.w_age', { k, total }),
      explain: `${total} : ${k + 1} = ${son}`,
    };
  },
  moreLess(r, ctx) {
    const b = r.int(8, 40), diff = r.int(3, 20);
    const total = 2 * b + diff;
    const [n1, n2] = r.sample(ctx.names, 2);
    return {
      type: 'number', answer: b, text: ctx.t('m.w_moreless', { a: n1, b: n2, diff, total }),
      explain: `(${total} ${MINUS} ${diff}) : 2 = ${b}`,
    };
  },
  partsLeft(r, ctx) {
    // "spent a third, then half of the rest, has X left"
    const left = r.int(4, 30);
    const start = left * 3;
    return {
      type: 'number', unit: ctx.cur, answer: start, text: ctx.t('m.w_parts', { name: r.pick(ctx.names), left, cur: ctx.cur }),
      explain: `${left} × 2 = ${left * 2}; ${left * 2} : 2 × 3 = ${start}`,
    };
  },
  speed(r, ctx) {
    const v = r.pick([12, 15, 18, 24, 30, 36, 45, 60, 72, 90]);
    const t = r.pick([10, 20, 30, 40, 50]);
    const d = (v * t) / 60;
    return {
      type: 'number', unit: 'km', answer: d, text: ctx.t('m.w_speed', { v, t }),
      explain: `${v} × ${t}/60 = ${ctx.f(d)}`,
    };
  },
  work(r, ctx) {
    const [a, b, res] = r.pick([[3, 6, 2], [4, 12, 3], [6, 12, 4], [10, 15, 6], [12, 24, 8], [20, 30, 12], [6, 3, 2], [12, 6, 4]]);
    return {
      type: 'number', unit: 'h', answer: res, text: ctx.t('m.w_work', { a, b }),
      explain: `1/${a} + 1/${b} = 1/${res}`,
    };
  },
  thinkNumber(r, ctx) {
    const x = r.int(4, 25), k = r.int(2, 6), s = r.int(3, 30);
    return {
      type: 'number', answer: x, text: ctx.t('m.w_think', { k, s, res: x * k - s }),
      explain: `(${x * k - s} + ${s}) : ${k} = ${x}`,
    };
  },
  rows(r, ctx) {
    const rows = r.int(4, 12), per = r.int(5, 15), extra = r.int(1, per - 1);
    const total = rows * per + extra;
    return {
      type: 'number', answer: rows + 1, text: ctx.t('m.w_rows', { total, per }),
      explain: `${total} : ${per} = ${rows} (${extra}) → ${rows + 1}`,
    };
  },
};

// ---------------------------------------------------------------- převody jednotek
const CONVERSIONS = {
  5: [
    () => ({ v: [3, 40], from: (a) => `${a[0]} km ${a[1]} m`, to: 'm', ans: (a) => a[0] * 1000 + a[1], gen: (r) => [r.int(1, 9), r.int(5, 950)] }),
    () => ({ from: (a) => `${a[0]} m ${a[1]} cm`, to: 'cm', ans: (a) => a[0] * 100 + a[1], gen: (r) => [r.int(1, 12), r.int(1, 99)] }),
    () => ({ from: (a) => `${a[0]} kg ${a[1]} g`, to: 'g', ans: (a) => a[0] * 1000 + a[1], gen: (r) => [r.int(1, 9), r.int(5, 995)] }),
    () => ({ from: (a) => `${a[0]} h ${a[1]} min`, to: 'min', ans: (a) => a[0] * 60 + a[1], gen: (r) => [r.int(1, 5), r.int(5, 55)] }),
    () => ({ from: (a) => `${a[0]} t ${a[1]} kg`, to: 'kg', ans: (a) => a[0] * 1000 + a[1], gen: (r) => [r.int(1, 9), r.int(10, 990)] }),
    () => ({ from: (a) => `${a[0] * 10} mm`, to: 'cm', ans: (a) => a[0], gen: (r) => [r.int(3, 90)] }),
    () => ({ from: (a) => `${a[0]} l`, to: 'ml', ans: (a) => a[0] * 1000, gen: (r) => [r.int(2, 9)] }),
    () => ({ from: (a) => `${a[0] * 60} min`, to: 'h', ans: (a) => a[0], gen: (r) => [r.int(2, 9)] }),
  ],
  7: [
    () => ({ from: (a, f) => `${f(a[0])} m`, to: 'cm', ans: (a) => Math.round(a[0] * 100), gen: (r) => [r.int(11, 95) / 10] }),
    () => ({ from: (a, f) => `${f(a[0])} kg`, to: 'g', ans: (a) => Math.round(a[0] * 1000), gen: (r) => [r.int(11, 95) / 10] }),
    () => ({ from: (a) => `${a[0]} m²`, to: 'dm²', ans: (a) => a[0] * 100, gen: (r) => [r.int(2, 30)] }),
    () => ({ from: (a) => `${a[0]} cm²`, to: 'dm²', ans: (a) => a[0] / 100, gen: (r) => [r.int(15, 95) * 10] }),
    () => ({ from: (a) => `${a[0]} dm³`, to: 'cm³', ans: (a) => a[0] * 1000, gen: (r) => [r.int(2, 9)] }),
    () => ({ from: (a, f) => `${f(a[0])} l`, to: 'ml', ans: (a) => Math.round(a[0] * 1000), gen: (r) => [r.int(11, 49) / 10] }),
    () => ({ from: (a) => `${a[0]} s`, to: 'min', ans: (a) => a[0] / 60, gen: (r) => [r.pick([30, 90, 150, 210, 270, 330])] }),
    () => ({ from: (a) => `${a[0]} cm³`, to: 'l', ans: (a) => a[0] / 1000, gen: (r) => [r.int(3, 45) * 500] }),
    () => ({ from: (a) => `${a[0]} ha`, to: 'm²', ans: (a) => a[0] * 10000, gen: (r) => [r.int(2, 9)] }),
  ],
  9: [
    () => ({ from: (a, f) => `${f(a[0])} km/h`, to: 'm/s', ans: (a) => a[0] / 3.6, gen: (r) => [r.pick([18, 36, 54, 72, 90, 108])] }),
    () => ({ from: (a, f) => `${f(a[0])} m²`, to: 'cm²', ans: (a) => Math.round(a[0] * 10000), gen: (r) => [r.int(2, 35) / 10] }),
    () => ({ from: (a, f) => `${f(a[0])} m³`, to: 'l', ans: (a) => Math.round(a[0] * 1000), gen: (r) => [r.int(2, 45) / 10] }),
    () => ({ from: (a, f) => `${f(a[0])} h`, to: 'min', ans: (a) => a[0] * 60, gen: (r) => [r.pick([0.25, 0.75, 1.5, 2.25, 3.5])] }),
    () => ({ from: (a) => `${a[0]} mm²`, to: 'cm²', ans: (a) => a[0] / 100, gen: (r) => [r.int(25, 900) * 2] }),
    () => ({ from: (a, f) => `${f(a[0])} t`, to: 'kg', ans: (a) => Math.round(a[0] * 1000), gen: (r) => [r.int(105, 995) / 100] }),
  ],
};

const jednotky = {
  convert(r, ctx) {
    const list = ctx.grade >= 9 ? [...CONVERSIONS[7], ...CONVERSIONS[9]] : ctx.grade >= 7 ? [...CONVERSIONS[5], ...CONVERSIONS[7]] : CONVERSIONS[5];
    const def = r.pick(list)();
    const a = def.gen(r);
    const ans = Math.round(def.ans(a) * 10000) / 10000;
    const from = def.from(a, ctx.f);
    return {
      type: 'number', text: ctx.t('m.convert'), expr: `${from} = ? ${def.to}`, unit: def.to, answer: ans,
      explain: `${from} = ${ctx.f(ans)} ${def.to}`,
    };
  },
  compare(r, ctx) {
    // which quantity is the largest?
    const base = r.int(2, 9);
    const opts = r.shuffle([
      { label: `${base} km`, v: base * 1000 },
      { label: `${base * 100 + r.int(1, 90)} m`, v: null },
      { label: `${base * 1000 - r.int(10, 400) * 10} dm`, v: null },
      { label: `${(base - 1) * 100000 + r.int(1, 9) * 1000} cm`, v: null },
    ]);
    const val = (l) => {
      const [n, u] = l.split(' ');
      return Number(n) * { km: 1000, m: 1, dm: 0.1, cm: 0.01 }[u];
    };
    const labels = opts.map((o) => o.label);
    const max = labels.reduce((best, l) => (val(l) > val(best) ? l : best), labels[0]);
    return { type: 'choice', text: ctx.t('m.largest_qty'), options: labels, answer: labels.indexOf(max), explain: `${max} = ${ctx.f(val(max))} m` };
  },
};

// ---------------------------------------------------------------- grafy, tabulky
const grafy = {
  bars(r, ctx) {
    const labels = r.sample(ctx.names, 5);
    const step = ctx.grade >= 7 ? r.pick([2, 5]) : 1;
    const values = labels.map(() => r.int(2, 12) * step);
    const kind = r.pick(ctx.grade >= 7 ? ['diff', 'sum', 'avg', 'max'] : ['diff', 'sum', 'max', 'diff']);
    const figure = { kind: 'bars', labels, values };
    const intro = ctx.t('m.g_books');
    if (kind === 'max') {
      const max = Math.max(...values);
      const idx = values.indexOf(max);
      if (values.filter((v) => v === max).length > 1) return grafy.bars(r, ctx);
      return { type: 'choice', text: `${intro} ${ctx.t('m.g_who_most')}`, figure, options: labels, answer: idx };
    }
    if (kind === 'sum') {
      const s = values.reduce((a, b) => a + b, 0);
      return { type: 'number', text: `${intro} ${ctx.t('m.g_total')}`, figure, answer: s, explain: `${values.join(' + ')} = ${s}` };
    }
    if (kind === 'avg') {
      const s = values.reduce((a, b) => a + b, 0);
      if (s % 5 !== 0) return grafy.bars(r, ctx);
      return { type: 'number', text: `${intro} ${ctx.t('m.g_avg')}`, figure, answer: s / 5, explain: `${s} : 5 = ${ctx.f(s / 5)}` };
    }
    const [i, j] = r.sample([0, 1, 2, 3, 4], 2);
    const [hi, lo] = values[i] >= values[j] ? [i, j] : [j, i];
    if (values[hi] === values[lo]) return grafy.bars(r, ctx);
    return {
      type: 'number', text: `${intro} ${ctx.t('m.g_more', { a: labels[hi], b: labels[lo] })}`, figure,
      answer: values[hi] - values[lo], explain: `${values[hi]} ${MINUS} ${values[lo]} = ${values[hi] - values[lo]}`,
    };
  },
  temperatures(r, ctx) {
    const days = r.sample(ctx.t('m.weekdays'), 5);
    const temps = days.map(() => r.int(-8, 9));
    const max = Math.max(...temps), min = Math.min(...temps);
    if (max === min) return grafy.temperatures(r, ctx);
    return {
      type: 'number', unit: '°C', text: ctx.t('m.g_temps'),
      figure: { kind: 'table', headers: days, rows: [temps.map((x) => `${neg(x)} °C`)] },
      answer: max - min, explain: neg(`${max} - (${min}) = ${max - min}`),
    };
  },
};

// ---------------------------------------------------------------- geometrie v rovině
const rovina = {
  rectangle(r, ctx) {
    const a = r.int(3, 15), b = r.int(2, 12);
    const kind = r.pick(['perimeter', 'area', 'sideFromPerimeter']);
    const figure = { kind: 'rect', a, b, unit: 'cm' };
    if (kind === 'perimeter') {
      return { type: 'number', unit: 'cm', figure, text: ctx.t('m.r_rect_per', { a, b }), answer: 2 * (a + b), explain: `2 × (${a} + ${b}) = ${2 * (a + b)}` };
    }
    if (kind === 'area') {
      return { type: 'number', unit: 'cm²', figure, text: ctx.t('m.r_rect_area', { a, b }), answer: a * b, explain: `${a} × ${b} = ${a * b}` };
    }
    return {
      type: 'number', unit: 'cm', text: ctx.t('m.r_rect_side', { p: 2 * (a + b), a }), answer: b,
      explain: `${2 * (a + b)} : 2 = ${a + b}; ${a + b} ${MINUS} ${a} = ${b}`,
    };
  },
  squarePerimeterToArea(r, ctx) {
    const s = r.int(3, 15);
    return { type: 'number', unit: 'cm²', text: ctx.t('m.r_square', { p: 4 * s }), answer: s * s, explain: `${4 * s} : 4 = ${s}; ${s} × ${s} = ${s * s}` };
  },
  lshape(r, ctx) {
    const a = r.int(8, 16), b = r.int(6, 12), c = r.int(2, Math.min(a, b) - 3);
    const figure = { kind: 'lshape', a, b, c, unit: 'cm' };
    if (r.chance(0.5)) {
      return { type: 'number', unit: 'cm²', figure, text: ctx.t('m.r_lshape_area', { a, b, c }), answer: a * b - c * c, explain: `${a} × ${b} ${MINUS} ${c} × ${c} = ${a * b - c * c}` };
    }
    return { type: 'number', unit: 'cm', figure, text: ctx.t('m.r_lshape_per', { a, b, c }), answer: 2 * (a + b), explain: `2 × (${a} + ${b}) = ${2 * (a + b)}` };
  },
  triangleAngle(r, ctx) {
    const a = r.int(25, 85), b = r.int(25, 155 - a);
    return { type: 'number', unit: '°', text: ctx.t('m.r_tri_angle', { a, b }), answer: 180 - a - b, explain: `180 ${MINUS} ${a} ${MINUS} ${b} = ${180 - a - b}` };
  },
  triangleArea(r, ctx) {
    const a = r.int(3, 16), h = r.int(2, 12) * (r.chance(0.5) ? 1 : 2);
    return { type: 'number', unit: 'cm²', text: ctx.t('m.r_tri_area', { a, h }), answer: (a * h) / 2, explain: `${a} × ${h} : 2 = ${ctx.f((a * h) / 2)}` };
  },
  circle(r, ctx) {
    const rr = r.int(2, 10);
    if (r.chance(0.5)) {
      const v = Math.round(3.14 * rr * rr * 100) / 100;
      return { type: 'number', unit: 'cm²', text: ctx.t('m.r_circle_area', { r: rr }), answer: v, explain: `3,14 × ${rr}² = ${ctx.f(v)}` };
    }
    const v = Math.round(2 * 3.14 * rr * 100) / 100;
    return { type: 'number', unit: 'cm', text: ctx.t('m.r_circle_len', { r: rr }), answer: v, explain: `2 × 3,14 × ${rr} = ${ctx.f(v)}` };
  },
  pythagoras(r, ctx) {
    const [x, y, z] = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [9, 12, 15], [7, 24, 25], [12, 16, 20]]);
    if (r.chance(0.5)) {
      return { type: 'number', unit: 'cm', text: ctx.t('m.r_pyth_hyp', { a: x, b: y }), answer: z, explain: `√(${x}² + ${y}²) = √${z * z} = ${z}` };
    }
    return { type: 'number', unit: 'cm', text: ctx.t('m.r_pyth_leg', { c: z, a: x }), answer: y, explain: `√(${z}² ${MINUS} ${x}²) = √${y * y} = ${y}` };
  },
};

// ---------------------------------------------------------------- geometrie v prostoru
const prostor = {
  cubesInCuboid(r, ctx) {
    const a = r.int(2, 6), b = r.int(2, 5), c = r.int(2, 5);
    return { type: 'number', figure: { kind: 'cuboid', a, b, c }, text: ctx.t('m.p_cubes', { a, b, c }), answer: a * b * c, explain: `${a} × ${b} × ${c} = ${a * b * c}` };
  },
  cuboidVolume(r, ctx) {
    const a = r.int(2, 12), b = r.int(2, 10), c = r.int(2, 9);
    if (r.chance(0.5)) {
      return { type: 'number', unit: 'cm³', figure: { kind: 'cuboid', a, b, c, unit: 'cm' }, text: ctx.t('m.p_volume', { a, b, c }), answer: a * b * c, explain: `${a} × ${b} × ${c} = ${a * b * c}` };
    }
    const s = 2 * (a * b + b * c + a * c);
    return { type: 'number', unit: 'cm²', figure: { kind: 'cuboid', a, b, c, unit: 'cm' }, text: ctx.t('m.p_surface', { a, b, c }), answer: s, explain: `2 × (${a}·${b} + ${b}·${c} + ${a}·${c}) = ${s}` };
  },
  cubeSurface(r, ctx) {
    const a = r.int(2, 12);
    return { type: 'number', unit: 'cm²', text: ctx.t('m.p_cube_surface', { a }), answer: 6 * a * a, explain: `6 × ${a} × ${a} = ${6 * a * a}` };
  },
  paintedCube(r, ctx) {
    const n = r.int(3, 6);
    const k = r.pick([3, 2, 1, 0]);
    const ans = { 3: 8, 2: 12 * (n - 2), 1: 6 * (n - 2) ** 2, 0: (n - 2) ** 3 }[k];
    return { type: 'number', text: ctx.t(`m.p_painted${k}`, { n }), answer: ans, explain: { 3: '8', 2: `12 × ${n - 2} = ${ans}`, 1: `6 × ${n - 2}² = ${ans}`, 0: `${n - 2}³ = ${ans}` }[k] };
  },
  staircase(r, ctx) {
    const n = r.int(4, 12);
    return { type: 'number', text: ctx.t('m.p_stairs', { n }), answer: (n * (n + 1)) / 2, explain: `1 + 2 + … + ${n} = ${(n * (n + 1)) / 2}` };
  },
  cylinder(r, ctx) {
    const rr = r.int(2, 6), h = r.int(3, 12);
    const v = Math.round(3.14 * rr * rr * h * 100) / 100;
    return { type: 'number', unit: 'cm³', text: ctx.t('m.p_cylinder', { r: rr, h }), answer: v, explain: `3,14 × ${rr}² × ${h} = ${ctx.f(v)}` };
  },
};

// ---------------------------------------------------------------- konstrukční úlohy
const konstrukce = {
  triangleInequality(r, ctx) {
    const statements = [];
    const answer = [];
    for (let i = 0; i < 4; i++) {
      const a = r.int(2, 10), b = r.int(2, 10);
      const ok = r.chance(0.5);
      const c = ok ? r.int(Math.abs(a - b) + 1, a + b - 1) : r.pick([a + b, a + b + r.int(1, 4)]);
      statements.push(ctx.t('m.k_tri_sides', { a, b, c }));
      answer.push(a + b > c && a + c > b && b + c > a);
    }
    return { type: 'tf', text: ctx.t('m.decide_tf'), statements, answer, explain: ctx.t('m.k_tri_rule') };
  },
  triangleAngles(r, ctx) {
    const statements = [];
    const answer = [];
    for (let i = 0; i < 4; i++) {
      const a = r.int(20, 100), b = r.int(20, 120);
      const ok = r.chance(0.5) && a + b < 175;
      const c = ok ? 180 - a - b : 180 - a - b + r.pick([-10, 10, 20, -20]);
      if (c <= 0) { i--; continue; }
      statements.push(ctx.t('m.k_tri_angles', { a, b, c }));
      answer.push(a + b + c === 180);
    }
    return { type: 'tf', text: ctx.t('m.decide_tf'), statements, answer, explain: ctx.t('m.k_angle_rule') };
  },
  locus(r, ctx) {
    const d = r.int(2, 6);
    const variants = [
      { text: ctx.t('m.k_locus_circle', { d }), correct: ctx.t('m.shape_circle'), wrong: ['m.shape_square', 'm.shape_line', 'm.shape_triangle'] },
      { text: ctx.t('m.k_locus_axis'), correct: ctx.t('m.shape_axis'), wrong: ['m.shape_circle', 'm.shape_square', 'm.shape_point'] },
    ];
    const v = r.pick(variants);
    return { ...choice(r, v.correct, v.wrong.map((k) => ctx.t(k))), text: v.text };
  },
  squareFromDiagonal(r, ctx) {
    const s = r.int(2, 9);
    const area = (2 * s * s) / 2; // diagonal d = s√2 ... use known diagonal instead
    const d = r.pick([4, 6, 8, 10, 12]);
    return {
      type: 'number', unit: 'cm²', text: ctx.t('m.k_square_diag', { d }), answer: (d * d) / 2,
      explain: `${d} × ${d} : 2 = ${(d * d) / 2}`, _unused: area,
    };
  },
};

// ---------------------------------------------------------------- aplikační úlohy netypicky zadané
const aplikace = {
  sequence(r, ctx) {
    const kind = r.pick(['arith', 'geom', 'alt', 'square', 'fib']);
    let seq;
    if (kind === 'arith') { const s = r.int(1, 30), d = r.int(2, 9); seq = [0, 1, 2, 3, 4, 5].map((i) => s + i * d); }
    if (kind === 'geom') { const s = r.int(1, 5), q = r.pick([2, 3]); seq = [0, 1, 2, 3, 4, 5].map((i) => s * q ** i); }
    if (kind === 'alt') { const s = r.int(10, 30), a = r.int(4, 9), b = r.int(1, 3); seq = [s]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + (i % 2 ? a : -b)); }
    if (kind === 'square') { const s = r.int(1, 4); seq = [0, 1, 2, 3, 4, 5].map((i) => (s + i) ** 2); }
    if (kind === 'fib') { const a = r.int(1, 4), b = r.int(2, 6); seq = [a, b]; for (let i = 2; i < 6; i++) seq.push(seq[i - 1] + seq[i - 2]); }
    const shown = seq.slice(0, 5);
    return { type: 'number', text: ctx.t('m.a_seq'), expr: `${shown.join(', ')}, ?`, answer: seq[5], explain: `${shown.join(', ')}, ${seq[5]}` };
  },
  clock(r, ctx) {
    const h = r.int(6, 15), m = r.int(5, 59), dh = r.int(0, 3), dm = r.int(10, 55);
    let total = h * 60 + m + dh * 60 + dm;
    const H = Math.floor(total / 60) % 24, M = total % 60;
    const pad = (x) => String(x).padStart(2, '0');
    const ans = `${H}:${pad(M)}`;
    return {
      type: 'text', text: ctx.t('m.a_clock', { start: `${h}:${pad(m)}`, dh, dm }), answer: [ans, `${H}.${pad(M)}`, `${pad(H)}:${pad(M)}`],
      placeholder: '00:00', explain: `${h}:${pad(m)} + ${dh} h ${dm} min = ${ans}`,
    };
  },
  handshakes(r, ctx) {
    const n = r.int(4, 12);
    return { type: 'number', text: ctx.t('m.a_hands', { n }), answer: (n * (n - 1)) / 2, explain: `${n} × ${n - 1} : 2 = ${(n * (n - 1)) / 2}` };
  },
  matches(r, ctx) {
    const n = r.int(4, 20);
    return { type: 'number', text: ctx.t('m.a_matches', { n }), answer: 3 * n + 1, explain: `4 + 3 × ${n - 1} = ${3 * n + 1}` };
  },
  pageDigits(r, ctx) {
    const n = r.int(15, 140);
    let s = 0;
    for (let i = 1; i <= n; i++) s += String(i).length;
    return { type: 'number', text: ctx.t('m.a_pages', { n }), answer: s, explain: n >= 100 ? `9 + 180 + ${(n - 99) * 3} = ${s}` : `9 + ${(n - 9) * 2} = ${s}` };
  },
  calendar(r, ctx) {
    const days = ctx.t('m.weekdays_full');
    const start = r.int(0, 6), target = r.int(8, 30);
    const ans = days[(start + target - 1) % 7];
    return { ...choice(r, ans, r.shuffle(days.filter((d) => d !== ans))), text: ctx.t('m.a_calendar', { day: days[start], n: target }), explain: `${target} ${MINUS} 1 = ${target - 1} = 7 × ${Math.floor((target - 1) / 7)} + ${(target - 1) % 7}` };
  },
  legs(r, ctx) {
    const chickens = r.int(3, 15), rabbits = r.int(2, 12);
    const heads = chickens + rabbits, legs = chickens * 2 + rabbits * 4;
    return { type: 'number', text: ctx.t('m.a_legs', { heads, legs }), answer: rabbits, explain: `(${legs} ${MINUS} 2 × ${heads}) : 2 = ${rabbits}` };
  },
};

// ---------------------------------------------------------------- osová (a středová) souměrnost
const SYM_LETTERS = { A: true, B: true, C: true, D: true, E: true, H: true, I: true, K: true, M: true, O: true, T: true, U: true, V: true, W: true, X: true, Y: true, F: false, G: false, J: false, L: false, N: false, P: false, Q: false, R: false, S: false, Z: false };
const SHAPE_AXES = [['m.shape_square', 4], ['m.shape_rectangle', 2], ['m.shape_eq_triangle', 3], ['m.shape_hexagon', 6], ['m.shape_rhombus', 2], ['m.shape_iso_triangle', 1], ['m.shape_parallelogram', 0]];

function randomShape(r, size = 4) {
  // connected-ish set of cells in the left half (cols 0..size-1)
  const cells = new Set();
  let x = r.int(0, size - 1), y = r.int(0, size - 1);
  cells.add(`${x},${y}`);
  const n = r.int(4, 6);
  let guard = 0;
  while (cells.size < n && guard++ < 100) {
    const [dx, dy] = r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
    x = nx; y = ny;
    cells.add(`${x},${y}`);
  }
  return [...cells].map((c) => c.split(',').map(Number));
}
const key = (cells) => cells.map(([a, b]) => `${a},${b}`).sort().join(';');

const soumernost = {
  mirrorGrid(r, ctx) {
    const size = 4;
    const shape = randomShape(r, size);
    const mirrorV = shape.map(([x, y]) => [size - 1 - x, y]);
    const flipH = shape.map(([x, y]) => [x, size - 1 - y]);
    const rot = shape.map(([x, y]) => [size - 1 - x, size - 1 - y]);
    const same = shape.map(([x, y]) => [x, y]);
    const central = ctx.grade >= 7 && r.chance(0.4);
    const correct = central ? rot : mirrorV;
    const pool = central ? [mirrorV, flipH, same] : [flipH, rot, same];
    if (new Set([correct, ...pool].map(key)).size < 4) return soumernost.mirrorGrid(r, ctx);
    const opts = r.shuffle([correct, ...pool]);
    return {
      type: 'choice', text: ctx.t(central ? 'm.s_central' : 'm.s_axis'),
      figure: { kind: 'grid', size, cells: shape, axis: central ? 'point' : 'vertical' },
      options: opts.map((cells) => ({ figure: { kind: 'grid', size, cells, small: true, axis: central ? 'point' : 'vertical' } })),
      answer: opts.indexOf(correct),
    };
  },
  letters(r, ctx) {
    const sym = Object.keys(SYM_LETTERS).filter((l) => SYM_LETTERS[l]);
    const non = Object.keys(SYM_LETTERS).filter((l) => !SYM_LETTERS[l]);
    const pick = r.shuffle([...r.sample(sym, 2), ...r.sample(non, 2)]);
    return {
      type: 'tf', text: ctx.t('m.decide_tf'), statements: pick.map((l) => ctx.t('m.s_letter', { l })), answer: pick.map((l) => SYM_LETTERS[l]),
    };
  },
  axesCount(r, ctx) {
    const [k, n] = r.pick(SHAPE_AXES);
    return { type: 'number', text: ctx.t('m.s_axes', { shape: ctx.t(k) }), answer: n, explain: `${n}` };
  },
};

// ---------------------------------------------------------------- poměr a procenta
const procenta = {
  percentOf(r, ctx) {
    const p = r.pick([5, 10, 15, 20, 25, 30, 40, 50, 75]), base = r.int(2, 30) * 20;
    return { type: 'number', text: ctx.t('m.pc_of', { p, n: base }), answer: (p * base) / 100, explain: `${base} × ${p} : 100 = ${ctx.f((p * base) / 100)}` };
  },
  priceChange(r, ctx) {
    const price = r.int(4, 40) * 50, p = r.pick([10, 20, 25, 30, 40]);
    const up = r.chance(0.5);
    const v = up ? price * (1 + p / 100) : price * (1 - p / 100);
    return { type: 'number', unit: ctx.cur, text: ctx.t(up ? 'm.pc_up' : 'm.pc_down', { price, p, cur: ctx.cur }), answer: v, explain: `${price} × ${up ? 100 + p : 100 - p} % = ${ctx.f(v)}` };
  },
  whatPercent(r, ctx) {
    const whole = r.pick([20, 25, 40, 50, 80, 200, 400]), p = r.pick([10, 20, 25, 40, 50, 75]);
    const part = (whole * p) / 100;
    if (!Number.isInteger(part)) return procenta.whatPercent(r, ctx);
    return { type: 'number', unit: '%', text: ctx.t('m.pc_what', { part, whole }), answer: p, explain: `${part} : ${whole} = ${ctx.f(part / whole)} = ${p} %` };
  },
  ratioSplit(r, ctx) {
    const a = r.int(1, 7), b = r.int(2, 9), k = r.int(3, 20);
    if (a === b) return procenta.ratioSplit(r, ctx);
    const total = (a + b) * k;
    return { type: 'number', text: ctx.t('m.pc_ratio', { total, a, b }), answer: Math.max(a, b) * k, explain: `${total} : ${a + b} = ${k}; ${Math.max(a, b)} × ${k} = ${Math.max(a, b) * k}` };
  },
  scale(r, ctx) {
    const s = r.pick([10000, 20000, 25000, 50000, 100000]), cm = r.int(2, 12);
    const km = (cm * s) / 100000;
    return { type: 'number', unit: 'km', text: ctx.t('m.pc_scale', { s: ctx.f(s), cm }), answer: km, explain: `${cm} × ${ctx.f(s)} cm = ${ctx.f(km)} km` };
  },
};

// ---------------------------------------------------------------- přímá, nepřímá úměrnost
const umernost = {
  inverse(r, ctx) {
    // n1 workers finish in t1 hours; how long for n2 workers (optionally bigger order)?
    for (let i = 0; i < 50; i++) {
      const n1 = r.int(2, 8), t1 = r.int(2, 12) * r.pick([2, 3, 4]), n2 = r.int(2, 9), k = r.pick([1, 1, 1.5, 2]);
      if (n1 === n2) continue;
      const t2 = (n1 * t1 * k) / n2;
      if (!Number.isInteger(t2)) continue;
      return {
        type: 'number', unit: 'h', context: ctx.t('m.u_workers_ctx', { n: n1, t: t1 }),
        text: ctx.t(k === 1 ? 'm.u_workers_q' : k === 2 ? 'm.u_workers_q2' : 'm.u_workers_q15', { n: n2 }),
        answer: t2, explain: `${n1} × ${t1}${k !== 1 ? ' × ' + ctx.f(k) : ''} : ${n2} = ${t2}`,
      };
    }
    return umernost.direct(r, ctx);
  },
  direct(r, ctx) {
    const per = r.int(2, 9), a = r.int(2, 8), b = r.int(3, 15);
    if (a === b) return umernost.direct(r, ctx);
    return {
      type: 'number', unit: 'l', text: ctx.t('m.u_car', { a: a * 100, l: per * a, b: b * 100 }), answer: per * b,
      explain: `${per * a} : ${a} = ${per}; ${per} × ${b} = ${per * b}`,
    };
  },
  ratioSplit: (r, ctx) => procenta.ratioSplit(r, ctx),
  scale: (r, ctx) => procenta.scale(r, ctx),
};

// ---------------------------------------------------------------- výrazy a rovnice
const vyrazy = {
  linear(r, ctx) {
    const x = r.int(-6, 9), a = r.int(2, 9), c = r.int(1, 9);
    if (a === c) return vyrazy.linear(r, ctx);
    const b = r.int(-15, 15), d = (a - c) * x + b;
    const L = `${a}x ${b < 0 ? MINUS : '+'} ${Math.abs(b)}`;
    const R = `${c}x ${d < 0 ? MINUS : '+'} ${Math.abs(d)}`;
    return { type: 'number', text: ctx.t('m.v_solve'), expr: `${L} = ${R}`, answer: x, explain: neg(`${a - c}x = ${d - b} → x = ${x}`) };
  },
  fractionEq(r, ctx) {
    const k = r.int(2, 6), x = k * r.int(1, 8), c = r.int(1, 12);
    return { type: 'number', text: ctx.t('m.v_solve'), expr: `x/${k} + ${c} = ${x / k + c}`, answer: x, explain: `x/${k} = ${x / k} → x = ${x}` };
  },
  expand(r, ctx) {
    const a = r.int(2, 9);
    const forms = [
      { e: `(x + ${a})²`, ok: `x² + ${2 * a}x + ${a * a}`, bad: [`x² + ${a * a}`, `x² + ${a}x + ${a * a}`, `x² + ${2 * a}x + ${2 * a}`] },
      { e: `(x ${MINUS} ${a})²`, ok: `x² ${MINUS} ${2 * a}x + ${a * a}`, bad: [`x² ${MINUS} ${a * a}`, `x² + ${2 * a}x + ${a * a}`, `x² ${MINUS} ${2 * a}x ${MINUS} ${a * a}`] },
      { e: `(x + ${a})(x ${MINUS} ${a})`, ok: `x² ${MINUS} ${a * a}`, bad: [`x² + ${a * a}`, `x² ${MINUS} ${2 * a}x ${MINUS} ${a * a}`, `x² ${MINUS} ${2 * a}`] },
      { e: `${a}(3x ${MINUS} 2) ${MINUS} x`, ok: `${3 * a - 1}x ${MINUS} ${2 * a}`, bad: [`${3 * a}x ${MINUS} ${2 * a}`, `${3 * a - 1}x ${MINUS} 2`, `${3 * a + 1}x ${MINUS} ${2 * a}`] },
    ];
    const f = r.pick(forms);
    return { ...choice(r, f.ok, f.bad), text: ctx.t('m.v_expand', { e: f.e }), expr: f.e, explain: `${f.e} = ${f.ok}` };
  },
  evaluate(r, ctx) {
    const x = r.pick([-3, -2, -1, 2, 3, 4]), a = r.int(1, 4), b = r.int(1, 6), c = r.int(-5, 9);
    const v = a * x * x - b * x + c;
    const e = `${a === 1 ? '' : a}x² ${MINUS} ${b === 1 ? '' : b}x ${c < 0 ? MINUS : '+'} ${Math.abs(c)}`;
    return { type: 'number', text: ctx.t('m.v_value', { x: neg(x) }), expr: e, answer: v, explain: neg(`${a}·(${x})² - ${b}·(${x}) + ${c} = ${v}`) };
  },
  system(r, ctx) {
    const x = r.int(1, 12), y = r.int(1, 12);
    return { type: 'number', text: ctx.t('m.v_system'), expr: `x + y = ${x + y};  x ${MINUS} y = ${neg(x - y)}`, answer: x, explain: `2x = ${2 * x} → x = ${x}` };
  },
};

// ---------------------------------------------------------------- registry
// [generator, minGrade, maxGrade]
export const MATH_GENERATORS = {
  cislo: [[cislo.orderOfOps, 5, 9], [cislo.missing, 5, 7], [cislo.rounding, 5, 5], [cislo.digits, 5, 7], [cislo.divisibility, 7, 9], [cislo.lcmGcd, 7, 9], [cislo.integers, 9, 9]],
  zlomky: [[cislo.fractions, 7, 9], [cislo.fractions, 7, 9], [cislo.decimals, 7, 9], [cislo.orderOfOps, 7, 9], [cislo.integers, 7, 9], [cislo.powers, 9, 9]],
  umernost: [[umernost.inverse, 7, 9], [umernost.direct, 7, 9], [umernost.ratioSplit, 7, 9], [umernost.scale, 7, 9]],
  slovni: [[slovni.shopping, 5, 7], [slovni.unitPrice, 5, 7], [slovni.ageTimes, 5, 9], [slovni.moreLess, 5, 9], [slovni.partsLeft, 7, 9], [slovni.speed, 7, 9], [slovni.work, 9, 9], [slovni.thinkNumber, 5, 9], [slovni.rows, 5, 7]],
  jednotky: [[jednotky.convert, 5, 9], [jednotky.convert, 5, 9], [jednotky.compare, 5, 7]],
  grafy: [[grafy.bars, 5, 9], [grafy.bars, 5, 9], [grafy.temperatures, 7, 9]],
  rovina: [[rovina.rectangle, 5, 7], [rovina.squarePerimeterToArea, 5, 7], [rovina.lshape, 5, 9], [rovina.triangleAngle, 7, 9], [rovina.triangleArea, 7, 9], [rovina.circle, 9, 9], [rovina.pythagoras, 9, 9]],
  prostor: [[prostor.cubesInCuboid, 5, 5], [prostor.cuboidVolume, 7, 9], [prostor.cubeSurface, 7, 9], [prostor.paintedCube, 7, 9], [prostor.staircase, 5, 7], [prostor.cylinder, 9, 9]],
  konstrukce: [[konstrukce.triangleInequality, 5, 9], [konstrukce.triangleAngles, 7, 9], [konstrukce.locus, 5, 7], [konstrukce.squareFromDiagonal, 7, 9]],
  aplikace: [[aplikace.sequence, 5, 9], [aplikace.clock, 5, 7], [aplikace.handshakes, 5, 9], [aplikace.matches, 5, 7], [aplikace.pageDigits, 7, 9], [aplikace.calendar, 5, 9], [aplikace.legs, 5, 9]],
  soumernost: [[soumernost.mirrorGrid, 5, 9], [soumernost.mirrorGrid, 5, 9], [soumernost.letters, 5, 9], [soumernost.axesCount, 5, 9]],
  procenta: [[procenta.percentOf, 7, 9], [procenta.priceChange, 7, 9], [procenta.whatPercent, 7, 9]],
  vyrazy: [[vyrazy.linear, 9, 9], [vyrazy.fractionEq, 9, 9], [vyrazy.expand, 9, 9], [vyrazy.evaluate, 9, 9], [vyrazy.system, 9, 9]],
};

export function mathGeneratorsFor(topic, grade) {
  const list = MATH_GENERATORS[topic] || [];
  const ok = list.filter(([, lo, hi]) => grade >= lo && grade <= hi).map(([g]) => g);
  return ok.length ? ok : list.map(([g]) => g);
}
