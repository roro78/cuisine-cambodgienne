import type { APIRoute } from 'astro';
import { recipes } from '../data/recipes';
import { ingredientGuides } from '../data/ingredients';

const staticPaths = ['/', '/recettes/', '/ingredients/', '/culture/', '/apprendre/'];

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://www.cuisine-du-cambodge.com');
  const paths = [
    ...staticPaths,
    ...recipes.map((recipe) => `/recettes/${recipe.slug}/`),
    ...ingredientGuides.map((ingredient) => `/ingredients/${ingredient.slug}/`)
  ];

  const urls = paths
    .map((path) => `  <url><loc>${new URL(path, base).href}</loc></url>`)
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
};
