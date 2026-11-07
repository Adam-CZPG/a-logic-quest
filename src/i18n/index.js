import en from './locales/en';
import cs from './locales/cs';
import uk from './locales/uk';
import ru from './locales/ru';

// The four languages most used by families in Czechia.
export const LANGS = [
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

const DICTS = { en, cs, uk, ru };

export function isRtl() {
  return false;
}

export function detectLang() {
  try {
    const nav = (navigator.languages || [navigator.language || 'cs']).map((l) => l.toLowerCase().split('-')[0]);
    // Slovak speakers read Czech comfortably
    const found = nav.map((l) => (l === 'sk' ? 'cs' : l)).find((l) => DICTS[l]);
    return found || 'en';
  } catch {
    return 'en';
  }
}

// translate(lang, 'p.points', { a: 3, b: 50 }) -> "points: 3/50"
export function translate(lang, key, vars) {
  const d = DICTS[lang] || en;
  let s = d[key];
  if (s === undefined) s = en[key];
  if (s === undefined) return key;
  if (Array.isArray(s)) return s;
  if (vars) {
    // gender agreement: {name?koupil|koupila} – picks the form by vars.nameG ('m' | 'f')
    s = s.replace(/\{(\w+)\?([^|{}]*)\|([^{}]*)\}/g, (m, k, masc, fem) => (vars[`${k}G`] === 'f' ? fem : masc));
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
  }
  return s;
}

export function currencyFor(lang, curriculum) {
  if (curriculum === 'cz' || lang === 'cs') return 'Kč';
  return { en: '€', uk: '₴', ru: '€' }[lang] || '€';
}

export const ALL_DICTS = DICTS;
