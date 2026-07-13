/**
 * Central map of all page routes in the shikshagraha-app.
 * Use these constants anywhere you need to reference a path —
 * avoids hardcoded strings scattered across the codebase.
 */
export const ROUTES = {
  /** Root page — serves as the Login screen */
  LOGIN: '/',
  HOME: '/home',
  REGISTER: '/register',
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile-edit',
  QR_SCANNER: '/qr-scanner',
  REDIRECTING: '/redirecting',
  RESET_PASSWORD: '/resetpassword',
  FORGET_PASSWORD: '/forgetpassword',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
