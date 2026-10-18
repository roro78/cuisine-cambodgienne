import type { APIRoute } from 'astro';
import { getSocialCatalog } from '../data/socialCatalog';

/** Public, static, non-secret discovery feed for the isolated Cuisine n8n workflow. */
export const GET: APIRoute = () => new Response(JSON.stringify({
  schemaVersion: 1,
  product: 'cuisine-du-cambodge',
  siteUrl: 'https://www.cuisine-du-cambodge.com',
  items: getSocialCatalog()
}), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300'
  }
});
