// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import node from '@astrojs/node';
import fontdueJs from 'fontdue-js/vite';

export default defineConfig({
  output: 'server',
  integrations: [react()],
  adapter: node({
    mode: 'standalone',
  }),
  vite: {
    plugins: [fontdueJs()],
  },
});
