import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://badenjki.business',
  trailingSlash: 'never',
  integrations: [
    icon({ iconDir: 'src/assets' }),
    sitemap({ filter: (url) => new URL(url).pathname.replace(/\/$/, '') !== '/badenjki-business' }),
  ],
});
