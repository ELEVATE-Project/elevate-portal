import enTranslations from '../../public/assets/locales/en.json';
import hiTranslations from '../../public/assets/locales/hi.json';
import mrTranslations from '../../public/assets/locales/mr.json';
import taTranslations from '../../public/assets/locales/ta.json';
import teTranslations from '../../public/assets/locales/te.json';
import guTranslations from '../../public/assets/locales/gu.json';
import bnTranslations from '../../public/assets/locales/bn.json';
import orTranslations from '../../public/assets/locales/or.json';
import paTranslations from '../../public/assets/locales/pa.json';
import knTranslations  from "../../public/assets/locales/kn.json";

/**
 * Language options and static i18n dictionaries for Shikshagraha App
 */

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
];

export const DEFAULT_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
];

export const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
  kn: 'Kannada',
  ta: 'Tamil',
  te: 'Telugu',
  gu: 'Gujarati',
  bn: 'Bengali',
  or: 'Odia',
  pa: 'Punjabi',
};

export type TranslationKey = keyof typeof enTranslations;

export const LOCALES: Record<string, Record<string, string>> = {
  en: enTranslations,
  hi: hiTranslations,
  mr: mrTranslations,
  kn: knTranslations,
  ta: taTranslations,
  te: teTranslations,
  gu: guTranslations,
  bn: bnTranslations,
  or: orTranslations,
  pa: paTranslations,
};

/**
 * Returns translated text for given key and language code with English fallback.
 * Uses public/assets/locales as the single source of truth.
 */
export function getTermsI18nText(key: string, lang: string = 'en'): string {
  const normalizedLang = (lang || 'en').toLowerCase();
  return LOCALES[normalizedLang]?.[key] || LOCALES['en']?.[key] || '';
}
