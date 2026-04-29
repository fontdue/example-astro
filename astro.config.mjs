// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import fontdueJs from 'fontdue-js/vite';

export default defineConfig({
  output: 'server',
  integrations: [react()],
  adapter: netlify(),
  vite: {
    plugins: [
      fontdueJs(),
      // Astro 6 builds prerendered pages in a separate Vite environment
      // ("prerender") that does not inherit legacy `ssr.noExternal`. The
      // fontdue-js plugin only sets noExternal on the SSR env, so without
      // this, prerender externalizes fontdue-js and its `import { graphql }
      // from 'react-relay'` runs against unrwitten CJS at build time.
      // Track upstream fix in fontdue-js/vite; remove this once it lands.
      {
        name: 'fontdue-js-prerender-noexternal',
        configEnvironment(name) {
          if (name === 'ssr' || name === 'prerender') {
            return { resolve: { noExternal: ['fontdue-js'] } };
          }
        },
      },
    ],
  },
});
