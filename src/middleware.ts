import { defineMiddleware } from 'astro:middleware';

// CDN-side caching for SSR pages. Netlify's edge serves the cached HTML
// instantly while regenerating in the background, so the page feels
// static (sub-100ms TTFB) without prerendering. Browsers always
// revalidate (`max-age=0`) so users see whatever the edge currently
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
    'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
  );
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  response.headers.set('Netlify-Cache-Tag', 'fontdue');
  return response;
});
