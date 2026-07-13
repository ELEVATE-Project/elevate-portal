import { NextResponse, NextRequest } from 'next/server';
import { ROUTES, RouteKey } from './constants/routes';
import { getEnvValue, getDisabledRouteKeys } from '@shared-lib';


/**
 * Parse NEXT_PUBLIC_DISABLED_ROUTES (comma-separated RouteKey names, e.g.
 * "HOME,REGISTER") into a Set of actual path strings.
 * Returns an empty Set when the variable is absent or blank.
 */
function getDisabledPaths(): Set<string> {
  const keys = getDisabledRouteKeys();
  return new Set(
    keys
      .filter((key) => key in ROUTES)
      .map((key) => ROUTES[key as RouteKey])
  );
}

/**
 * Returns true when `pathname` matches a disabled path.
 * Exact match for `/` (login); prefix match for all other paths so that
 * e.g. `/home/subpage` is also protected when HOME is disabled.
 */
function isDisabled(pathname: string, disabledPaths: Set<string>): boolean {
  for (const path of disabledPaths) {
    if (path === '/') {
      if (pathname === '/') return true;
    } else if (pathname === path || pathname.startsWith(path + '/')) {
      return true;
    }
  }
  return false;
}



export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = request.nextUrl;

  const accToken = request.cookies.get('accToken');
  const redirectUrl = request.nextUrl.searchParams.get('redirectUrl');

  if ((pathname === '/' || pathname === '/login') && accToken && !redirectUrl) {
    return NextResponse.redirect(new URL(ROUTES.HOME, request.url));
  }

  if (pathname.startsWith(ROUTES.HOME) && !accToken) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  const disabledPaths = getDisabledPaths();


  if (disabledPaths.size > 0 && isDisabled(pathname, disabledPaths)) {
    if (!accToken) {
      return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    }

    const mfeRedirect = getEnvValue('NEXT_PUBLIC_MFE_REDIRECT_URL')?.trim();
    if (mfeRedirect) {
      return NextResponse.redirect(new URL(mfeRedirect, request.url));
    }

    // Fallback: if route is disabled but no MFE redirect is provided, render 404 page
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  if (url.pathname.startsWith('/registration')) {
    url.hostname = 'localhost';
    url.port = '4300';
    return NextResponse.rewrite(url);
  }

  if (url.pathname.startsWith('/content')) {
    url.hostname = 'localhost';
    url.port = '4301';
    return NextResponse.rewrite(url);
  }

  if (url.pathname.startsWith('/sbplayer')) {
    url.hostname = 'localhost';
    url.port = '4108';
    return NextResponse.rewrite(url);
  }

  if (url.pathname.startsWith('/pwa')) {
    url.hostname = 'localhost';
    url.port = '4200';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
