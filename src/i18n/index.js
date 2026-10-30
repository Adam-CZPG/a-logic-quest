import en from './locales/en';
import cs from './locales/cs';
import uk from './locales/uk';
import uz from './locales/uz';
import ru from './locales/ru';
import de from './locales/de';
import es from './locales/es';
import fr from './locales/fr';
import pt from './locales/pt';
import pl from './locales/pl';
import tr from './locales/tr';
import zh from './locales/zh';
import hi from './locales/hi';
import ar from './locales/ar';

export const LANGS = [
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
];

const DICTS = { en, cs, uk, uz, ru, de, es, fr, pt, pl, tr, zh, hi, ar };

export function isRtl(lang) {
  return !!LANGS.find((l) => l.code === lang)?.rtl;
}

export function detectLang() {
  try {
    const nav = (navigator.languages || [navigator.language || 'en']).map((l) => l.toLowerCase().split('-')[0]);
    return nav.find((l) => DICTS[l]) || 'en';
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
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
  }
  return s;
}

export function currencyFor(lang, curriculum) {
  if (curriculum === 'cz' || lang === 'cs') return 'Kč';
  return { en: '$', uk: '₴', ru: '₽', pl: 'zł', tr: '₺', zh: '¥', hi: '₹', pt: 'R$' }[lang] || '€';
}

export const ALL_DICTS = DICTS;
