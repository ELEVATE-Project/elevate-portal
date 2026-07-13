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
  
  // Safe fallback for critical variables during build-time or if runtime config fails
  const publicVars: Record<string, string | undefined> = {
    NEXT_PUBLIC_CONTENT_BASE_URL: process.env.NEXT_PUBLIC_CONTENT_BASE_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_SSUNBIRD_BASE_URL: process.env.NEXT_PUBLIC_SSUNBIRD_BASE_URL,
    NEXT_PUBLIC_ORGID: process.env.NEXT_PUBLIC_ORGID,
    NEXT_PUBLIC_DISABLED_ROUTES: process.env.NEXT_PUBLIC_DISABLED_ROUTES,
    NEXT_PUBLIC_MFE_REDIRECT_URL: process.env.NEXT_PUBLIC_MFE_REDIRECT_URL,
  };

  if (publicVars[key] !== undefined && publicVars[key] !== '') {
    return publicVars[key];
  }

  return process.env[key];
};

export const getDisabledRouteKeys = (): string[] => {
  const raw = (getEnvValue('NEXT_PUBLIC_DISABLED_ROUTES') ?? '').trim();
  if (!raw) return [];
  let keys: string[] = [];
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      keys = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      keys = [];
    }
  } else {
    keys = raw.split(',');
  }
  return keys.map((key) => key.trim().toUpperCase());
};

export const isRouteDisabled = (routeKey: string): boolean => {
  return getDisabledRouteKeys().includes(routeKey.trim().toUpperCase());
};

export const getBaseUrl = () => '/api/proxy';
export const getContentBaseUrl = () => getEnvValue('NEXT_PUBLIC_CONTENT_BASE_URL') || '';

export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((row) => row.startsWith(name + '='));
  const value = cookie ? cookie.split('=')[1] : null;
  return value && value !== 'null' && value !== 'undefined' ? value : null;
};
export const getSunbirdBaseUrl = () => getEnvValue('NEXT_PUBLIC_SSUNBIRD_BASE_URL') || '';
export const getOrgId = () => getEnvValue('NEXT_PUBLIC_ORGID') || '';
