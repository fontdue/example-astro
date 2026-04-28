import React from 'react';
import {
  TypeTesterPreloaded,
  type TypeTesterPreloadedQuery,
} from 'fontdue-js/TypeTester/preload';

// This wrapper is load-bearing in Astro. If you reference `TypeTesterPreloaded`
// directly from `.astro` frontmatter and hydrate it with `client:load`, Astro
// uses the frontmatter's resolved import path as the island's client entry —
// and that path was resolved under SSR conditions (`node` → CJS in
// fontdue-js's package exports). The browser then loads the CJS build and
// crashes with `exports is not defined`. Wrapping in a local `.tsx` makes
// THIS file the island entry, so Vite resolves the package import under
// client conditions and ships the ESM build.
interface Props {
  preloadedQuery: TypeTesterPreloadedQuery;
  content?: string;
  fontSize?: number;
}

export default function TypeTesterIsland({ preloadedQuery, content, fontSize }: Props) {
  return (
    <TypeTesterPreloaded preloadedQuery={preloadedQuery} content={content} fontSize={fontSize} />
  );
}
