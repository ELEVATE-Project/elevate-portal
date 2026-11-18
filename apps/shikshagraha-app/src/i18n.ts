import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../public/assets/locales/en.json';
import hiTranslations from '../public/assets/locales/hi.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  hi: {
    translation: hiTranslations,
  },
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
