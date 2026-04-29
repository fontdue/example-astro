# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A demo/integration POC showing how to consume `fontdue-js@3.x` (alpha) — the framework-agnostic preload API, Linear FD-537 — from an Astro SSR site. The same preload pattern is meant to apply to any React-rendering SSR framework (React Router 7, TanStack Start, Vike, Remix). Pin a specific `fontdue-js` alpha version; the 3.x surface is unstable until 3.0.0 ships.

Sibling POCs validating the same API on other frameworks (useful for cross-checking patterns):
- `~/code/fontdue/fontdue-rr7-example` — React Router 7 (`loader` returning `preloadedQuery`).
- `~/code/fontdue/fontdue-example-next` — Next.js 15 App Router (RSC magic path via async server component).

## Commands

```sh
cp .env.example .env   # required before first run; sets PUBLIC_FONTDUE_URL
npm install
npm run dev            # astro dev on http://localhost:4321
npm run build          # astro build (SSR, @astrojs/node standalone)
npm run preview        # astro preview
```

There is no test suite, no linter, and no formatter wired up. Don't fabricate one.

Node `>=22.12.0` is required (engines field).

## Architecture

The whole point of this repo is the SSR preload wiring. Three files do all the work — read them together, not separately:

- **`astro.config.mjs`** — `output: 'server'`, `@astrojs/node` standalone adapter, `@astrojs/react`, and `fontdueJs()` Vite plugin. The plugin is non-optional: it sets up `vite-plugin-cjs-interop` for `react-relay` / `relay-runtime` / `draft-js` / `fbjs` (CJS deps that break strict ESM named imports), `ssr.noExternal: ['fontdue-js']` so that interop runs over fontdue-js's own source, `optimizeDeps.include` for the browser pre-bundle, and `define: { global: 'globalThis' }` for `fbjs`. If imports of fontdue-js subpaths suddenly break in dev or build, the plugin or its included dep list is the first place to look.

- **`src/layouts/Layout.astro`** — preloads the layout-level aux UI (theme custom properties, test-mode flag, tracking config, cart count) via `loadFontdueProviderQuery()` + `loadCartButtonQuery()` in parallel, then renders `<FontdueProvider client:load preloadedQuery={…} />`. The provider commits the preloaded payload into the shared client Relay env on hydration (via `useSerializablePreloadedQuery` calling `commitPayload`) so theme/banner/tracking render with no flash and no refetch — load-bearing for non-streaming SSR (`renderToString` would otherwise emit a Suspense fallback). `<StoreModal>` is mounted with `client:load` and **no** `preloadedQuery` — the modal is closed at SSR; cart data fetches lazily on open. Don't add a preload there.

- **Page frontmatter** (`src/pages/index.astro`, `src/pages/fonts/[slug].astro`, `src/pages/test-fonts.astro`) — each page calls the matching `load*Query` for the components it renders, in parallel via `Promise.all`. Each component (`TypeTester`, `TypeTesters`, `CharacterViewer`, `BuyButton`, `TestFontsForm`, `NewsletterSignup`, etc.) is then `client:load`-hydrated with its own `preloadedQuery` prop. Multiple islands share one Relay env + one Redux store via module-level singletons inside fontdue-js — no duplicate fetches across islands on the same page.

Backend URL: `PUBLIC_FONTDUE_URL` in `.env`. fontdue-js auto-reads `PUBLIC_FONTDUE_URL` / `VITE_FONTDUE_URL` from `import.meta.env` on both server and client — no explicit `configure()` call. The default tenant `https://example.fontdue.xyz` has CORS allow-listed `http://localhost:4321`; pointing at another tenant requires that tenant to allow-list the dev origin.

## Conventions specific to this repo

- Pages must be SSR (`output: 'server'` or hybrid with the page opted in) — the `load*Query` calls run in Astro frontmatter.
- Always preload in parallel with `Promise.all` when a route has multiple `load*Query` calls — that's the established pattern across all three pages.
- The same component import (e.g. `fontdue-js/TypeTester`) yields both the loader (`load*Query` named export) and the component (default export). Don't reach for separate import paths.
- A `<TypeTester>` placed inside an existing `<FontdueProvider>` tree (e.g. Next.js layouts) accepts the lazy `{familyName, styleName}` shape and auto-detects the parent provider, skipping its own self-wrap. This Astro example uses the eager `preloadedQuery` shape because each island is hydrated independently from the layout.
- Mount exactly one `<FontdueProvider>` per page (in `Layout.astro`). It owns the aux UI (`ThemeConfig`, `TestModeBanner`, `ConsentBanner`, `Tracking`, `ServerConfigProvider`); the previous "first-wins arbitration" between competing providers was deleted, so duplicating it would re-render aux UI twice. Per-component islands self-wrap in an internal `FontdueContextProvider` that does *not* claim the aux-UI slot.
