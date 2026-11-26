import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALES } from '../constants/languages';

/**
 * Language Translation Pipe
 * Resolves language-specific content from:
 * 1. Multi-lingual objects e.g. { en: "...", hi: "..." }
 * 2. Nested objects e.g. { en: { text: "..." } } or { label: { en: "..." } }
 * 3. Static translation keys matching public/assets/locales e.g. 'accept', 'decline'
 * 4. Automatic fallback: targetLang -> baseLang (e.g. 'en' from 'en-US') -> 'en' -> first key -> fallback
 */
export function translatePipe(
  source: any,
  lang: string = 'en',
  fallbackText: string = ''
): string {
  if (source === undefined || source === null) {
    return fallbackText;
  }

  const targetLang = (lang || 'en').toLowerCase();

  // If already a plain string, check if it matches a static translation key in LOCALES
  if (typeof source === 'string') {
    const baseLang = targetLang.includes('-')
      ? targetLang.split('-')[0]
      : undefined;
    const keyMatch =
      LOCALES[targetLang]?.[source] ||
      (baseLang ? LOCALES[baseLang]?.[source] : undefined) ||
      LOCALES['en']?.[source];
    if (keyMatch) {
      return keyMatch;
    }
    return source;
  }

  // If object containing language keys e.g. { en: "...", hi: "..." }
  if (typeof source === 'object') {
    const record = source as Record<string, any>;
    // 1. Direct match for target language
    let match = record[targetLang];

    // 2. Try base language if target has locale (e.g., 'en-US' -> 'en')
    if (match === undefined && targetLang.includes('-')) {
      const baseLang = targetLang.split('-')[0];
      if (baseLang) {
        match = record[baseLang];
      }
    }

    // 3. Fallback to English
    if (match === undefined) {
      match = record['en'];
    }

    // 4. Fallback to first available language in object
    if (match === undefined) {
      const keys = Object.keys(record);
      const firstKey = keys[0];
      if (firstKey && typeof record[firstKey] !== 'function') {
        match = record[firstKey];
      }
    }

    if (match === undefined || match === null) {
      return fallbackText;
    }

    if (typeof match === 'string') {
      return match;
    }

    // Handle nested { text: "..." } or { label: "..." } or { value: "..." } objects
    if (typeof match === 'object') {
      if (typeof match.text === 'string') return match.text;
      if (typeof match.label === 'string') return match.label;
      if (typeof match.value === 'string') return String(match.value);
    }

    if (typeof match === 'number' || typeof match === 'boolean') {
      return String(match);
    }
  }

  return fallbackText;
}

/**
 * Formats markdown patterns:
 * - Converts **bold text** into <strong>bold text</strong>
 * - Fixes duplicate consecutive heading tags (e.g. <h4...><h4...>)
 */
export function formatMarkdownContent(rawContent: string): string {
  if (!rawContent) return '';
  return rawContent
    .replace(/(<h[1-6][^>]*>)\s*<h[1-6][^>]*>/gi, '$1')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Custom React hook for translating content using current or specified language
 */
export function useTranslatePipe(forcedLang?: string) {
  const { i18n } = useTranslation();
  const currentLang = forcedLang || i18n?.language || 'en';

  return useMemo(() => {
    return (source: any, fallbackText: string = ''): string => {
      return translatePipe(source, currentLang, fallbackText);
    };
  }, [currentLang]);
}
