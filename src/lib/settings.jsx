import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translate, detectLang, isRtl, ALL_DICTS } from '@/i18n';
import { fitGrade, CURRICULA } from '@/exam/taxonomy';

const KEY = 'lq_settings_v1';

const DEFAULTS = {
  lang: null,
  name: '',
  startedAt: null, // first day with the app – the start of the child's journey
  startGrade: null,
  curriculum: 'cz',
  grade: 5,
  state: null, // German federal state (curriculum 'de')
  onboarded: false,
  theme: 'system',
  reminder: { on: false, time: '17:00' },
  avatar: null, // animal sticker shown in duels
  english: false, // optional English where it is not an exam subject (Czechia, Slovakia)
};

// before 2.4 English was always on: children who already practised it keep it
function hadEnglish() {
  try {
    const topics = JSON.parse(localStorage.getItem('lq_stats_v1') || '{}').topics || {};
    return Object.keys(topics).some((k) => k.startsWith('english:'));
  } catch {
    return false;
  }
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    // languages removed in 2.1 fall back to the device language
    const lang = raw.lang && ALL_DICTS[raw.lang] ? raw.lang : detectLang();
    const curriculum = CURRICULA[raw.curriculum] ? raw.curriculum : DEFAULTS.curriculum;
    const grade = fitGrade(curriculum, Number(raw.grade) || DEFAULTS.grade);
    const english = typeof raw.english === 'boolean' ? raw.english : hadEnglish();
    return { ...DEFAULTS, ...raw, english, lang, curriculum, grade, startedAt: raw.startedAt || (raw.onboarded ? Date.now() : null), startGrade: raw.startGrade || raw.grade || null };
  } catch {
    return { ...DEFAULTS, lang: detectLang() };
  }
}

const Ctx = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // language direction + theme on <html>
  useEffect(() => {
    const el = document.documentElement;
    el.lang = settings.lang;
    el.dir = isRtl(settings.lang) ? 'rtl' : 'ltr';
  }, [settings.lang]);

  useEffect(() => {
    const el = document.documentElement;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq?.matches);
      el.classList.toggle('dark', !!dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#121a2e' : '#f7f8fc');
    };
    apply();
    mq?.addEventListener?.('change', apply);
    return () => mq?.removeEventListener?.('change', apply);
  }, [settings.theme]);

  const value = useMemo(() => {
    const t = (key, vars) => translate(settings.lang, key, vars);
    return { settings, update, t };
  }, [settings, update]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  return useContext(Ctx);
}

export function useT() {
  return useContext(Ctx).t;
}
