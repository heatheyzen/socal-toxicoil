'use client';
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Language } from './types';
import en from '../locales/en.json';
import es from '../locales/es.json';

const strings = { en, es } as const;

interface I18nContextValue {
  lang: Language;
  t: (key: string) => string;
  setLang: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const stored = localStorage.getItem('socal-toxicoil-lang');
    if (stored === 'en' || stored === 'es') {
      setLangState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('socal-toxicoil-lang', l);
      document.documentElement.lang = l;
    }
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = strings[lang];
    for (const k of keys) val = val?.[k];
    return typeof val === 'string' ? val : key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
