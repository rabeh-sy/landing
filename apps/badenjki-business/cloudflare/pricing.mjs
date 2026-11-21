const pricingRoute = /^\/(?:(ar|en)\/)?pricing(?:\/index\.html)?\/?$/;
const headers = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex',
};

export default {
  fetch(request) {
    const url = new URL(request.url);
    if (url.hostname !== 'badenjki.business' || !pricingRoute.test(url.pathname) || request.cf?.country !== 'SY') {
      return new Response(null, { status: 404, headers });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET, HEAD' } });
    }

    return fetch(request);
  },
};
