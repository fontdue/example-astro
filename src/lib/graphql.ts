import { createFontdueFetch, FontdueNotFoundError } from 'fontdue-js/server';

// A single server-side GraphQL fetcher for the whole app. It resolves the
// Fontdue URL from the environment (PUBLIC_FONTDUE_URL) and handles the POST and
// error handling, so there's no transport boilerplate at the call sites.
//
// There's no per-request binding: because src/middleware.ts wraps every request
// in runWithFontdue, this fetcher automatically forwards the admin preview token
// when an admin is previewing (revealing unpublished fonts) and the visitor's
// node-access token for a collection they've unlocked, and sends a plain request
// otherwise. The same is true of every fontdue-js preload helper
// (loadTypeTesterQuery, loadFontdueProviderQuery, …) — call them with just their
// variables and they pick up the ambient context.
//
// Use it at the top of a page's frontmatter:
//
//   const data = await fetchGraphql<IndexQuery>('Index', IndexDoc);
export const fetchGraphql = createFontdueFetch();

export { FontdueNotFoundError };
