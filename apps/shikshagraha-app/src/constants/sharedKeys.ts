/**
 * Shared browser-storage and URL parameter names used by authentication,
 * language selection, redirect handoff, and terms acceptance flows.
 */
export const SHARED_KEYS = {
  ACCESS_TOKEN: 'accToken',
  ACCESS_TOKEN_LEGACY: 'accessToken',
  TOKEN: 'token',
  REFRESH_TOKEN: 'refToken',
  REFRESH_TOKEN_LEGACY: 'refreshToken',
  FLOW: 'flow',
  REDIRECT_URL: 'redirectUrl',
  REDIRECT_URL_LEGACY: 'redirecturl',
  PREFERRED_LANGUAGE: 'preferred_language',
  PREFERRED_LANGUAGE_LEGACY: 'preferredLanguage',
  TERMS_ENABLED: 'has_terms_and_conditions',
  TERMS_ACCEPTED: 'has_accepted_terms_and_conditions',
  TERMS_SETTING_LOADED: 'tenant_terms_setting_loaded',
  TERMS_ACCEPTANCE_SESSION: 'terms_acceptance_session',
} as const;
