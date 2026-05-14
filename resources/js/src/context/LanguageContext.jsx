import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../i18n/translations';

const LANGUAGE_KEY = 'sirius_lang';
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || 'ar');

    useEffect(() => {
        localStorage.setItem(LANGUAGE_KEY, language);
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    const value = useMemo(() => ({
        language,
        isArabic: language === 'ar',
        toggleLanguage() {
            setLanguage((previous) => (previous === 'ar' ? 'en' : 'ar'));
        },
        t(key, vars = {}) {
            const dictionary = translations[language] || translations.en;
            const fallback = translations.en[key] || key;
            const text = dictionary[key] || fallback;

            return Object.entries(vars).reduce(
                (acc, [name, value]) => acc.replace(`{${name}}`, String(value)),
                text
            );
        },
    }), [language]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }

    return context;
}
