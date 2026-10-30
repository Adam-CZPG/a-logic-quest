import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translate, detectLang, isRtl } from '@/i18n';

const KEY = 'lq_settings_v1';

const DEFAULTS = {
  lang: null,
  curriculum: 'cz',
  grade: 5,
  onboarded: false,
  theme: 'system',
  reminder: { on: false, time: '17:00' },
};

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULTS, ...raw, lang: raw.lang || detectLang() };
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
