import typography from '@tailwindcss/typography';

export default {
  content: {
    relative: true,
    files: ['./src/**/*.{astro,md,ts}'],
  },
  plugins: [typography],
};
