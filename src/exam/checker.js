// Answer checking for every task type. Pure functions, unit-tested in scripts/selftest.mjs.
//
// Task types (see CONTENT.md):
//   choice  – one correct option, answer = index
//   number  – numeric answer, answer = number (accepts "2,5", "2.5", "5/2", "1 250")
//   text    – short written answer, answer = [accepted strings]
//   tf      – ANO/NE statements, answer = [true,false,...]
//   match   – pair every left item with a right option, answer = [rightIndex,...]

export function parseNumber(input) {
  if (input === null || input === undefined) return null;
  let s = String(input).trim().replace(/−/g, '-').replace(/[\s  ]/g, '');
  if (!s) return null;
  // mixed number "1 1/2" collapsed to "11/2" by the space strip – handle "1+1/2" style not needed
  const frac = s.match(/^(-?\d+(?:[.,]\d+)?)\/(-?\d+(?:[.,]\d+)?)$/);
  if (frac) {
    const a = Number(frac[1].replace(',', '.'));
    const b = Number(frac[2].replace(',', '.'));
    if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
    return a / b;
  }
  // thousands separators like 1.250,5 are rare for kids – treat a single comma as decimal
  if ((s.match(/,/g) || []).length === 1 && !s.includes('.')) s = s.replace(',', '.');
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function normalizeText(s) {
  return String(s ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s ]+/g, ' ')
    .replace(/\s*[,;]\s*/g, ', ')
    .replace(/[.!?:]+$/g, '')
    .trim();
}

function isEmpty(q, response) {
  if (response === null || response === undefined) return true;
  if (q.type === 'tf' || q.type === 'match') {
    return !Array.isArray(response) || response.every((v) => v === null || v === undefined);
  }
  if (typeof response === 'string') return response.trim() === '';
  return false;
}

// Returns { correct: bool, score: number, max: number, empty: bool }
export function checkAnswer(q, response) {
  const max = q.points || 1;
  if (isEmpty(q, response)) return { correct: false, score: 0, max, empty: true };

  switch (q.type) {
    case 'choice': {
      const ok = Number(response) === q.answer;
      return { correct: ok, score: ok ? max : 0, max, empty: false };
    }
    case 'number': {
      const n = parseNumber(response);
      const accepted = Array.isArray(q.answer) ? q.answer : [q.answer];
      const tol = q.tolerance ?? 1e-9;
      const ok = n !== null && accepted.some((a) => Math.abs(n - a) <= tol + 1e-12 * Math.abs(a));
      return { correct: ok, score: ok ? max : 0, max, empty: false };
    }
    case 'text': {
      const given = normalizeText(response);
      const ok = q.answer.some((a) => normalizeText(a) === given);
      return { correct: ok, score: ok ? max : 0, max, empty: false };
    }
    case 'tf': {
      const total = q.answer.length;
      let right = 0;
      q.answer.forEach((a, i) => {
        if (response[i] === a) right++;
      });
      const ok = right === total;
      // CERMAT-style: full points for all correct, one point less for exactly one mistake
      let score = 0;
      if (ok) score = max;
      else if (max >= 2 && right === total - 1) score = max - 1;
      return { correct: ok, score, max, empty: false, right, total };
    }
    case 'match': {
      const total = q.answer.length;
      let right = 0;
      q.answer.forEach((a, i) => {
        if (response[i] === a) right++;
      });
      const ok = right === total;
      const score = ok ? max : Math.floor((right / total) * max);
      return { correct: ok, score, max, empty: false, right, total };
    }
    default:
      return { correct: false, score: 0, max, empty: false };
  }
}

const COMMA_LANGS = new Set(['cs', 'uk', 'uz', 'ru', 'de', 'es', 'fr', 'pt', 'pl', 'tr']);

export function decimalSep(lang) {
  return COMMA_LANGS.has(lang) ? ',' : '.';
}

// Format a number for display in the user's language (2.5 -> "2,5" in Czech).
export function fmt(n, lang = 'en', maxDecimals = 4) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return String(n);
  const rounded = Math.round(n * 10 ** maxDecimals) / 10 ** maxDecimals;
  let s = String(rounded);
  if (s.includes('e')) s = rounded.toFixed(maxDecimals).replace(/0+$/, '').replace(/\.$/, '');
  const [int, dec] = s.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  const grouped = digits.length > 4 ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : digits;
  return sign + grouped + (dec ? decimalSep(lang) + dec : '');
}

export function answerToString(q, lang = 'en') {
  switch (q.type) {
    case 'choice':
      return `${String.fromCharCode(65 + q.answer)}) ${optionLabel(q.options[q.answer])}`;
    case 'number': {
      const a = Array.isArray(q.answer) ? q.answer[0] : q.answer;
      const shown = q.answerDisplay ?? fmt(a, lang);
      return `${q.prefix ? q.prefix + ' ' : ''}${shown}${unitSuffix(q.unit)}`;
    }
    case 'text':
      return q.answer[0];
    default:
      return '';
  }
}

export function optionLabel(opt) {
  if (opt && typeof opt === 'object') return opt.label ?? '';
  return String(opt);
}

export function unitSuffix(unit) {
  if (!unit) return '';
  return unit === '°' ? '°' : ` ${unit}`;
}
