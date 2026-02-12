declare global {
  interface Window {
    __ENV: {
      [key: string]: string;
    };
  }
}

/**
 * Utility to access environment variables at runtime or build time.
 * Preference: window.__ENV (Runtime) > process.env (Build-time)
 */

export const getEnvValue = (key: string): string | undefined => {
  if (typeof window !== 'undefined' && window.__ENV && window.__ENV[key]) {
    return window.__ENV[key];
  }
  return process.env[key];
};

export const getBaseUrl = () => getEnvValue('NEXT_PUBLIC_BASE_URL') || '';
export const getSunbirdBaseUrl = () => getEnvValue('NEXT_PUBLIC_SSUNBIRD_BASE_URL') || '';
export const getOrgId = () => getEnvValue('NEXT_PUBLIC_ORGID') || '';
