import type { APIRoute } from 'astro';
import { handlePreviewRequest } from 'fontdue-js/preview';

// Preview enter/exit. The Fontdue admin toolbar — shown only to logged-in
// admins by <FontdueProvider> — POSTs a short-lived token here to turn preview
// on, and DELETEs to turn it off. handlePreviewRequest sets the preview
// cookies (an httpOnly token + a readable marker that the toolbar checks);
// src/middleware.ts wraps each request in runWithPreview, which forwards the
// token to GraphQL and keeps preview pages out of the shared CDN cache so the
// public never sees unpublished fonts. The default path is /api/preview — to
// use another path, set config.preview.endpoint on <FontdueProvider> and
// rename this file.
export const ALL: APIRoute = ({ request }) => handlePreviewRequest(request);

// Must run per request to set cookies — never prerender this route.
export const prerender = false;
