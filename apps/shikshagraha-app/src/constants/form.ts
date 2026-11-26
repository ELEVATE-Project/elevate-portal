/**
 * Keeps the form type/subtype/flow identifiers in one place so account and
 * registration schema reads cannot drift from the backend contract.
 */
export const FORM_CONFIG = {
  DEFAULT_TYPE: 'user',
  DEFAULT_SUB_TYPE: 'registration',
  FLOW_TYPE: 'registration',
  LOGIN_SUB_TYPE: 'login',
  TERMS_TYPE: 'policy',
  TERMS_SUB_TYPE: 'termsAndConditions',
} as const;

export type FormConfig = typeof FORM_CONFIG;
