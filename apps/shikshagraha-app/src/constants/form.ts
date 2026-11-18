/**
 * Constants for Dynamic Form configuration and schema reading.
 */
export const FORM_CONFIG = {
  DEFAULT_TYPE: 'user',
  DEFAULT_SUB_TYPE: 'registration',
  FLOW_TYPE: 'registration',
} as const;

export type FormConfig = typeof FORM_CONFIG;
