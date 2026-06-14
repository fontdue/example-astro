import { createFontdueFetch, FontdueNotFoundError } from 'fontdue-js/server';
import { previewAuthHeaders } from 'fontdue-js/preview';

// Bind a Fontdue GraphQL fetcher for the current request. When a staff member
// is previewing, their token — read into Astro.locals by src/middleware.ts — is
// forwarded so the response includes unpublished ("hidden") fonts; for the
// public it's a plain fetch. createFontdueFetch (from fontdue-js) handles the
// URL, the POST and error handling, so there's no transport boilerplate here.
//
// Use it at the top of a page's frontmatter:
//
//   const { fetchGraphql, preview } = fontdueGraphql(Astro.locals);
//   const data = await fetchGraphql<IndexQuery>('Index', IndexDoc);
//
// `preview` is an options object ({ headers }) understood by both
// createFontdueFetch and every fontdue-js preload helper, so the same object
// wires preview into all of them — pass it to preloads too, e.g.
// loadTypeTesterQuery(vars, preview), so their islands reveal unpublished
// fonts. For the public the headers are empty, so it's always safe to pass.
export function fontdueGraphql(locals: App.Locals) {
  const preview = { headers: previewAuthHeaders(locals.fontduePreviewToken) };
  return { fetchGraphql: createFontdueFetch(preview), preview };
}

export { FontdueNotFoundError };
