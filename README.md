# fontdue-js on Astro

A working example of using [fontdue-js](https://www.npmjs.com/package/fontdue-js) in an [Astro](https://astro.build/) site with full SSR — no client-side query refetch on hydration, no theming flash, no per-island duplicate fetches.

This is one of the integration POCs for the framework-agnostic preload API (Linear FD-537). The same pattern works in any React-rendering SSR framework (React Router 7, TanStack Start, Vike, Remix, etc.).

## What it demonstrates

- Two TypeTester islands on one page, both server-rendered, both hydrating without a refetch.
- The fontdue-js preload entry (`fontdue-js/TypeTester/preload`) used directly from an `.astro` page.
- Backend URL configured once in middleware via `configure({ url })`. No URL passed at the call site.

## Setup

```sh
cp .env.example .env
npm install
npm run dev
```

Open <http://localhost:4321>.

The default `.env.example` points at `https://example.fontdue.xyz`, which has CORS allow-listed `http://localhost:4321`. Point `PUBLIC_FONTDUE_URL` at your own tenant if you have one — the client origin will need to be in your tenant's allowed origins.

## How the integration is wired

Four files do the work:

- **`.env`** — `PUBLIC_FONTDUE_URL` is the tenant origin. The `PUBLIC_` prefix exposes it to client code (Astro convention); fontdue-js's client-side runtime auto-reads `PUBLIC_FONTDUE_URL` / `VITE_FONTDUE_URL` from `import.meta.env`.

- **`src/middleware.ts`** — calls `configure({ url })` once at module load. This is the URL the server-side preload uses. Astro reads `import.meta.env.PUBLIC_FONTDUE_URL` directly here; no `process.env` plumbing needed.

- **`src/layouts/Layout.astro`** — imports `fontdue-js/fontdue.css` once for every page that uses the layout. Pages then just wrap their content in `<Layout>…</Layout>` and don't need to think about the stylesheet.

- **`src/pages/index.astro`** — the integration shape consumers will write:

  ```astro
  ---
  import { loadTypeTesterQuery, TypeTesterPreloaded } from 'fontdue-js/TypeTester/preload';
  import Layout from '../layouts/Layout.astro';

  const preloaded = await loadTypeTesterQuery({ familyName: '…', styleName: '…' });
  ---

  <Layout>
    <TypeTesterPreloaded client:load preloadedQuery={preloaded} content="…" fontSize={64} />
  </Layout>
  ```

  `loadTypeTesterQuery` runs in the Astro frontmatter (server). `TypeTesterPreloaded` renders server-side as HTML, then `client:load` hydrates it on the client using the same preloaded payload — no network call on hydration. Multiple islands on the same page share one Relay environment + one Redux store under the hood, so auxiliary queries (theme, test-mode banner) only fire once.

## Required Vite SSR config

`astro.config.mjs` includes one fontdue-js-specific line:

```js
import fontdueJs from 'fontdue-js/vite';

export default defineConfig({
  // …
  vite: {
    plugins: [fontdueJs()],
  },
});
```

**Why:** fontdue-js publishes per-file ESM (no bundler at our publish step). Some of its transitive deps (`react-relay`, `draft-js`, `fbjs`) are CJS and use re-export shapes that Node's strict ESM-CJS interop can't named-import from. Vite's default SSR behavior is to externalize node_modules and let Node load them — which crashes with `Named export 'X' not found. The requested module is a CommonJS module`. The `fontdueJs()` plugin sets `ssr.noExternal` for fontdue-js plus its CJS-shaped deps, routing them through Vite's commonjs plugin which handles named imports correctly.

## Astro requirements

- `output: 'server'` (or `'hybrid'` with the page opted in) — the preload runs in frontmatter, which needs SSR.
- An SSR adapter — this example uses `@astrojs/node` in `standalone` mode.
- `@astrojs/react` for the React renderer.

## Status

This example tracks the `framework-agnostic-fontdue-js` branch of fontage. It currently installs fontdue-js from a local tarball (`file:../fontage/fontdue-js/...tgz`) — once that branch ships to npm, the dependency will become a normal `^x.y.z` reference.
