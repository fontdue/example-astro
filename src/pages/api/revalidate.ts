import type { APIRoute } from 'astro';
import { purgeCache } from '@netlify/functions';

// POST /api/revalidate — invalidate cached HTML so the next request
// regenerates against fresh Fontdue data. Authenticated with a shared
// secret in REVALIDATE_TOKEN.
//
// The Fontdue API does not currently include a collection id/slug in
// its change notifications, so this purges every page tagged `fontdue`
// (set in src/middleware.ts) in one call. If per-collection tags
// become available later, switch the tag to `fontdue:${slug}` in
// `fonts/[slug].astro` via `Astro.response.headers.set` and pass the
// matching tag here.
export const POST: APIRoute = async ({ request }) => {
  const expected = import.meta.env.REVALIDATE_TOKEN;
  if (!expected) {
    return new Response('REVALIDATE_TOKEN not configured', { status: 500 });
  }

  const provided =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    new URL(request.url).searchParams.get('token');

  if (provided !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  await purgeCache({ tags: ['fontdue'] });

  return new Response(JSON.stringify({ purged: ['fontdue'] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
