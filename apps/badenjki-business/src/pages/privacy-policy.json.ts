import type { APIRoute } from 'astro';
import policy from '../content/privacy-policy.json?raw';

export const GET: APIRoute = () => new Response(policy, {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  },
});
