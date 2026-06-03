import { defineMiddleware } from 'astro:middleware';

// CDN-side caching for SSR pages. Netlify's edge serves the cached HTML
// instantly while regenerating in the background, so the page feels
// static (sub-100ms TTFB) without prerendering. `durable` opts into
// Netlify's Durable Cache so the cached HTML persists across deploys and
// regions (the regular edge cache is per-node and volatile) — this is what
// makes the stale-while-revalidate window behave like real ISR. Browsers
// always revalidate (`max-age=0`) so users see whatever the edge currently
// holds — never a locally-cached copy. Tag every page with `fontdue`
// so the /api/revalidate endpoint can purge them all at once when
// Fontdue data changes.
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  if (
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
