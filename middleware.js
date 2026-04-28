import { NextResponse } from 'next/server';

// Castford route → static HTML map.
// Keep this in sync with middleware config.matcher below.
//
// L3 Pro Pack pages (/cfo, /controller, /fpa, /ceo) each have their own
// bespoke executive surface (Phase 3 part 6) with client-side entitlement
// gating via /site/dashboard/pack-guard.js.
//
// /treasurer remains on the legacy engine-driven hub.html until its bespoke
// page is built. The role is derived from window.location.pathname inside
// hub.html. (Vercel's static resolver looks for literal file paths and
// query strings cause 404s, so no query string in the rewrite target.)
const ROUTE_MAP = {
  '/':           '/site/landing.html',
  '/login':      '/site/login.html',
  '/signup':     '/site/signup.html',
  '/logout':     '/site/logout.html',

  // L3 Pro Pack command centers — bespoke HTML per role (Phase 3 part 6)
  // Each page includes the pack-guard.js entitlement check.
  '/cfo':           '/site/dashboard/cfo.html',
  '/controller':    '/site/dashboard/controller.html',
  '/fpa':           '/site/dashboard/fpa.html',
  '/ceo':           '/site/dashboard/ceo.html',

  // CFO sub-routes
  '/cfo/pnl':       '/site/dashboard/cfo/pnl.html',
  '/cfo/cash':      '/site/dashboard/cfo/cash.html',
  '/cfo/budget':    '/site/dashboard/cfo/budget.html',
  '/cfo/forecast':  '/site/dashboard/cfo/forecast.html',

  // Engine-driven dashboards still using hub.html (no bespoke page yet)
  '/treasurer':     '/site/dashboard/hub.html',

  // Legacy routes
  '/standard':      '/site/dashboard/standard.html',
  '/cashflow':      '/site/dashboard/cashflow.html',
};

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const target = ROUTE_MAP[pathname];
  if (target) {
    return NextResponse.rewrite(new URL(target, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/logout',
    '/cfo',
    '/cfo/pnl',
    '/cfo/cash',
    '/cfo/budget',
    '/cfo/forecast',
    '/ceo',
    '/controller',
    '/fpa',
    '/treasurer',
    '/standard',
    '/cashflow',
  ],
};
