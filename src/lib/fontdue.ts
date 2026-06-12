// Astro hydrates every `client:*` component as its own React island, so there
// is no global fontdue-js config: `config` set on `<FontdueProvider>` does not
// reach the testers and other components on the page (they're sibling islands,
// not React descendants). Define the shared config here once and pass it to
// each component via its `config` prop — see the fontdue-js README, "UI config".
import type { Config } from 'fontdue-js';

export const fontdueConfig = {
  typeTester: { selectable: true },
} satisfies Config;
