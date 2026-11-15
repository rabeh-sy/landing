import type { APIRoute } from 'astro';
import privacy from '../content/privacy-policy.json';
import terms from '../content/terms.json';

export const GET: APIRoute = () => new Response(JSON.stringify({ privacy, terms }), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  },
});
