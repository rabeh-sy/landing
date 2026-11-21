const pricingRoute = /^\/(?:(ar|en)\/)?pricing(?:\/index\.html)?\/?$/;
const headers = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex',
};

const copy = {
  ar: {
    brand: 'بادنجكي الإداري',
    title: 'الأسعار',
    message: 'نعمل على تقديم أسعار مناسبة.',
    alternate: 'English',
    direction: 'rtl',
  },
  en: {
    brand: 'Badenjki Business',
    title: 'Pricing',
    message: 'We’re working on good prices.',
    alternate: 'العربية',
    direction: 'ltr',
  },
};

function renderPricing(language) {
  const { brand, title, message, alternate, direction } = copy[language];
  const otherLanguage = language === 'ar' ? 'en' : 'ar';
  return `<!doctype html>
<html lang="${language}" dir="${direction}">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} | ${brand}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #f5f6f0; color: #102219; font: 1rem/1.6 system-ui, sans-serif; }
  header { border-bottom: 1px solid #173f2b20; }
  nav, main { max-width: 1440px; margin-inline: auto; padding-inline: clamp(1.25rem, 4vw, 3rem); }
  nav { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-block: 1rem; }
  a { color: #173f2b; font-weight: 700; }
  a:first-child { text-decoration: none; }
  a:first-child:hover { text-decoration: underline; }
  main { padding-block: clamp(3rem, 8vw, 5rem); }
  h1 { margin: 0; font-size: clamp(2.25rem, 6vw, 3rem); line-height: 1.25; }
  p { margin-block: 1.25rem 0; color: #445a4d; font-size: 1.125rem; }
</style>
<header>
  <nav>
    <a href="/${language}">${brand}</a>
    <a href="/${otherLanguage}/pricing" lang="${otherLanguage}">${alternate}</a>
  </nav>
</header>
<main>
  <h1>${title}</h1>
  <p>${message}</p>
</main>
</html>`;
}

export default {
  fetch(request) {
    const url = new URL(request.url);
    const route = url.pathname.match(pricingRoute);
    if (url.hostname !== 'badenjki.business' || !route || request.cf?.country !== 'SY') {
      return new Response(null, { status: 404, headers });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET, HEAD' } });
    }

    const language = route[1] ?? 'ar';
    return new Response(request.method === 'HEAD' ? null : renderPricing(language), { headers });
  },
};
