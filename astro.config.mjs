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
    plugins: [fontdueJs()],
  },
});
