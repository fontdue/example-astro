import { defineMiddleware } from 'astro:middleware';
import { readPreviewToken } from 'fontdue-js/preview';
import { runWithPreview } from 'fontdue-js/preview/server';

// Two responsibilities, both per request:
//
// 1. Preview. runWithPreview puts the logged-in staff member's token (from the
//    preview cookie) into an ambient context for the whole render, so every
//    GraphQL fetch and fontdue-js preload reveals unpublished ("hidden") fonts
//    with no per-page plumbing — and it forces preview responses out of the
//    shared cache so a staff render is never served to the public. (This relies
//    on middleware running in the same runtime as the render, which is the
//    default. If you set `edgeMiddleware: true`, the context can't cross to the
//    render — fall back to reading the token here and threading
//    previewAuthHeaders(token) into fetches/preloads explicitly.)
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

  const response = await runWithPreview(context.request, next);

  // Only public, non-preview HTML gets the long-lived CDN cache. Preview
  // responses were already marked uncacheable by runWithPreview.
  if (
    previewing ||
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
