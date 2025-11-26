const AppConst = {
  BASEPATH: process.env.NEXT_PUBLIC_SHIKSHAGRAHA_BASEPATH || '',
  API_ENDPOINTS: {
    REDIRECT_TOKEN: '/api/auth/redirect-token',
    // Add other API endpoints here
  },
  NAVIGATION: {
    HOME: '/',
    LOGIN: '/login',
    PROFILE: '/profile',
    REDIRECTING: '/redirecting',
  },
  EXTERNAL_URLS: {
    MITRA: 'https://your-mitra-base-url.com', // Replace with actual Mitra URL
  },
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'accToken',
    HOME_DATA: 'HomeData',
    HEADERS: 'headers',
    THEME: 'theme',
    FIRST_NAME: 'firstname',
  },
  ERROR_MESSAGES: {
    AUTH_TOKEN_MISSING: 'Authentication token not found',
    ORG_ID_MISSING: 'Organization ID not found',
    HOME_DATA_LOAD_FAILED: 'Failed to load home data',
    INVALID_URL: 'Invalid URL provided for external navigation',
  },

  // UI Constants
  UI: {
    COLORS: {
      PRIMARY: '#582E92',
      SECONDARY: '#FFFFFF',
      TEXT_PRIMARY: '#582E92',
      TEXT_SECONDARY: 'text.secondary',
    },
    LOADING_DELAY: {
      CACHED_CONTENT: 100,
      CACHED_PAGE: 300,
      FRESH_CONTENT: 500,
      FRESH_PAGE: 800,
    },
  },
};

export default AppConst;
