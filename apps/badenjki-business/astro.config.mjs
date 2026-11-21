import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://badenjki.business',
  trailingSlash: 'never',
  integrations: [
    icon({ iconDir: 'src/assets' }),
    sitemap({
      filter: (url) => {
        const pathname = new URL(url).pathname;
        return /^\/(ar|en)(\/|$)/.test(pathname) && !/^\/(ar|en)\/pricing\/?$/.test(pathname);
      },
    }),
  ],
});
