// A tiny translation system: no library needed.
//
//   const { t, lang, setLang, formatNumber } = useI18n();
//   t('map.hello', { name: 'Eleni' })   ->  "Γεια σου, Eleni!"
//   tList('feedback.correct')            ->  array of phrases
//   formatNumber(3.5)                    ->  "3,5" in Greek, "3.5" in English

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import el from './el.json';
import en from './en.json';
import { getSetting, setSetting } from '../db/db.js';

const DICTIONARIES = { el, en };
const LOCALES = { el: 'el-GR', en: 'en-GB' };

const I18nContext = createContext(null);

function guessLanguage() {
  return navigator.language?.toLowerCase().startsWith('el') ? 'el' : 'en';
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(guessLanguage);

  // Load the saved language once on start.
  useEffect(() => {
    getSetting('language').then((saved) => saved && setLangState(saved));
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next);
    setSetting('language', next);
  }, []);

  const value = useMemo(() => {
    const dict = DICTIONARIES[lang];
    const numberFormat = new Intl.NumberFormat(LOCALES[lang]);

    const t = (key, vars = {}) => {
      const text = dict[key] ?? DICTIONARIES.en[key] ?? key;
      if (typeof text !== 'string') return key;
      return text.replace(/\{(\w+)\}/g, (_, name) =>
        typeof vars[name] === 'number' ? numberFormat.format(vars[name]) : (vars[name] ?? ''),
      );
    };
    const tList = (key) => dict[key] ?? DICTIONARIES.en[key] ?? [];
    const formatNumber = (n) => (typeof n === 'number' ? numberFormat.format(n) : n);

    return { lang, setLang, t, tList, formatNumber };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
