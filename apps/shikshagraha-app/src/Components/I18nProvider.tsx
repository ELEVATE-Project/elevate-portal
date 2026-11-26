'use client';

import React, { useEffect } from 'react';
import '../i18n';
import i18n from '../i18n';
import { SHARED_KEYS } from '../constants/sharedKeys';
import { extractAndStoreUrlParams } from '../utils/Helper';

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  // Prefer an incoming language parameter, then saved preferences, so every
  // route renders in the language selected before authentication or redirect.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Universally extract & store tokens (accToken, refToken, flow, lang) and clean URL
        extractAndStoreUrlParams();

        const urlParams = new URLSearchParams(window.location.search);
        let queryLang =
          urlParams.get(SHARED_KEYS.PREFERRED_LANGUAGE) ||
          urlParams.get(SHARED_KEYS.PREFERRED_LANGUAGE_LEGACY);

        if (!queryLang) {
          const redirectUrl =
            urlParams.get(SHARED_KEYS.REDIRECT_URL) ||
            urlParams.get(SHARED_KEYS.REDIRECT_URL_LEGACY);
          if (redirectUrl) {
            try {
              let decoded = redirectUrl;
              try {
                decoded = decodeURIComponent(redirectUrl);
              } catch {
                // Use the original value when it is not URI-encoded.
              }
              if (decoded.includes('&') && !decoded.includes('?')) {
                decoded = decoded.replace('&', '?');
              }
              const parsed = new URL(decoded);
              queryLang =
                parsed.searchParams.get(SHARED_KEYS.PREFERRED_LANGUAGE) ||
                parsed.searchParams.get(SHARED_KEYS.PREFERRED_LANGUAGE_LEGACY);
            } catch {
              // Ignore
            }
          }
        }

        if (queryLang) {
          const normalized = queryLang.trim().toLowerCase();
          localStorage.setItem(SHARED_KEYS.PREFERRED_LANGUAGE, normalized);
          localStorage.setItem(SHARED_KEYS.PREFERRED_LANGUAGE_LEGACY, normalized);
          if (i18n.language !== normalized) {
            i18n.changeLanguage(normalized);
          }
        } else {
          // Fall back to English as default if no language specified
          const stored =
            localStorage.getItem(SHARED_KEYS.PREFERRED_LANGUAGE_LEGACY) ||
            localStorage.getItem(SHARED_KEYS.PREFERRED_LANGUAGE) ||
            'en';
          const targetLang = stored.toLowerCase();
          if (i18n.language !== targetLang) {
            i18n.changeLanguage(targetLang);
          }
        }
      } catch (e) {
        console.error('Error detecting query language in I18nProvider:', e);
      }
    }

    const handleStorageChange = () => {
      const stored =
        localStorage.getItem(SHARED_KEYS.PREFERRED_LANGUAGE_LEGACY) ||
        localStorage.getItem(SHARED_KEYS.PREFERRED_LANGUAGE) ||
        'en';
      if (stored && stored.toLowerCase() !== i18n.language) {
        i18n.changeLanguage(stored.toLowerCase());
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return <>{children}</>;
}
