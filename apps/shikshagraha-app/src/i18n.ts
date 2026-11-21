import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../public/assets/locales/en.json';
import hiTranslations from '../public/assets/locales/hi.json';
import mrTranslations from '../public/assets/locales/mr.json';
import taTranslations from '../public/assets/locales/ta.json';
import teTranslations from '../public/assets/locales/te.json';
import guTranslations from '../public/assets/locales/gu.json';
import bnTranslations from '../public/assets/locales/bn.json';
import orTranslations from '../public/assets/locales/or.json';
import paTranslations from '../public/assets/locales/pa.json';
import knTranslations from "../public/assets/locales/kn.json";

const resources = {
  en: {
    translation: enTranslations,
  },
  hi: {
    translation: hiTranslations,
  },
  mr: { translation: mrTranslations },
  ta: { translation: taTranslations },
  te: { translation: teTranslations },
  gu: { translation: guTranslations },
  bn: { translation: bnTranslations },
  or: { translation: orTranslations },
  pa: { translation: paTranslations },
  kn: { translation: knTranslations },
};

const getInitialLanguage = (): string => {
  // Server and first client render must use the same language. I18nProvider
  // applies URL/localStorage preferences in an effect after hydration.
  return 'en';
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;
