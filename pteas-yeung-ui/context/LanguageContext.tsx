'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Lang = 'kh' | 'en';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  // Aliases for backward compatibility with lib/LanguageContext
  language: Lang;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('kh');

  useEffect(() => {
    const savedLang = (localStorage.getItem('lang') || localStorage.getItem('language')) as Lang;
    if (savedLang === 'kh' || savedLang === 'en') {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
    localStorage.setItem('language', newLang);
  };

  const toggleLanguage = () => {
    setLang(lang === 'kh' ? 'en' : 'kh');
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, language: lang, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
