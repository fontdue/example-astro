import { defineMiddleware } from 'astro:middleware';
import { readPreviewToken } from 'fontdue-js/preview';
import { runWithFontdue } from 'fontdue-js/server/middleware';

// Two responsibilities, both per request:
//
// 1. Fontdue request context. runWithFontdue puts two request-scoped tokens
//    into an ambient context for the whole render: the logged-in admin's preview
//    token (reveals unpublished "hidden" fonts) and the visitor's per-collection
//    node-access token (a collection they unlocked with a password). Every
//    GraphQL fetch and fontdue-js preload forwards them with no per-page
//    plumbing, and it forces a per-visitor response out of the shared cache so
//    an admin's — or an unlocked visitor's — render is never served to the
//    public. (runWithFontdue is runWithPreview composed with runWithNodeAccess;
//    mount either alone if you only need one.) This relies on middleware running
//    in the same runtime as the render, which is the default. If you set
//    `edgeMiddleware: true`, the context can't cross to the render — fall back to
//    reading the cookies here and threading previewAuthHeaders(token) /
//    nodeAccessHeadersFromCookie(cookie) into fetches/preloads explicitly.
//
// 2. CDN caching for public pages. Netlify's edge serves the cached HTML
//    instantly while regenerating in the background, so the page feels static
//    (sub-100ms TTFB) without prerendering. `durable` opts into Netlify's
//    Durable Cache so the cached HTML persists across deploys and regions (the
//    regular edge cache is per-node and volatile) — this is what makes the
//    stale-while-revalidate window behave like real ISR. Browsers always
//    revalidate (`max-age=0`) so users see whatever the edge currently holds.
//    Tag every page with `fontdue` so /api/revalidate can purge them all at
//    once when Fontdue data changes.
export const onRequest = defineMiddleware(async (context, next) => {
  const previewing =
    readPreviewToken(context.request.headers.get('cookie')) != null;

  const response = await runWithFontdue(context.request, next);

  // Only public HTML gets the long-lived CDN cache. runWithFontdue already
  // marked per-visitor responses (admin preview, or a collection this visitor
  // unlocked via the node-access cookie) `no-store`; don't override that, or an
  // unlocked render could be cached and served to someone who hasn't unlocked.
  if (
    previewing ||
    response.headers.get('cache-control')?.includes('no-store') ||
    response.status !== 200 ||
    context.url.pathname.startsWith('/api/') ||
    !response.headers.get('content-type')?.includes('text/html')
  ) {
    return response;
  }

  response.headers.set(
    'Netlify-CDN-Cache-Control',
    'public, durable, s-maxage=31536000, stale-while-revalidate=86400',
  );
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  response.headers.set('Netlify-Cache-Tag', 'fontdue');
  // Collapse every query param into one cache entry per path. None of the
  // example's routes vary on a query param (the testers switch client-side),
  // so a sentinel that never appears in real traffic (`__none`) makes tracking
  // params (utm_*, fbclid) and anything else share one cached page instead of
  // each pinning its own copy in the 1-year durable cache. Without this,
  // Netlify's default for SSR functions varies on the full query string.
  response.headers.set('Netlify-Vary', 'query=__none');
  return response;
});
