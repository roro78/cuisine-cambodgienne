import type { APIRoute } from 'astro';
import { recipes } from '../data/recipes';
import { ingredientGuides } from '../data/ingredients';
import { cultureArticles } from '../data/culture';

const staticPaths = ['/', '/recettes/', '/ingredients/', '/culture/', '/apprendre/', '/a-propos/', '/glossaire/', '/credits-photos/'];

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://www.cuisine-du-cambodge.com');
  const paths = [
    ...staticPaths,
    ...recipes.map((recipe) => `/recettes/${recipe.slug}/`),
    ...ingredientGuides.map((ingredient) => `/ingredients/${ingredient.slug}/`),
    ...cultureArticles.map((article) => `/culture/${article.slug}/`)
  ];

  const urls = paths
    .map((path) => {
      const depth = path.split('/').filter(Boolean).length;
      const priority = path === '/' ? '1.0' : depth === 1 ? '0.9' : '0.8';
      return `  <url><loc>${new URL(path, base).href}</loc><priority>${priority}</priority></url>`;
    })
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
};
