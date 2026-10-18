// Contrôle gratuit et déterministe de toutes les pages SEO issues du sitemap.
// Aucun appel réseau, aucun accès Search Console, aucune publication.
// Ce contrôle sert également de garde-fou avant chaque publication OVH.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'https://www.cuisine-du-cambodge.com';
const DIST = 'dist';
const sitemapFile = join(DIST, 'sitemap.xml');
assert.ok(existsSync(sitemapFile), 'Le sitemap compile doit exister');
const sitemap = readFileSync(sitemapFile, 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.ok(urls.length > 0, 'Le sitemap ne doit pas etre vide');
assert.equal(new Set(urls).size, urls.length, 'URLs en doublon dans le sitemap');

const failures = [];
const allPaths = new Set();
const pageFor = (pathname) => join(DIST, pathname.replace(/^\//, ''), 'index.html');

for (const sourceUrl of urls) {
  let parsed;
  try { parsed = new URL(sourceUrl); }
  catch { failures.push(`URL sitemap invalide : ${sourceUrl}`); continue; }
  if (parsed.origin !== BASE || parsed.search || parsed.hash || !parsed.pathname.endsWith('/')) {
    failures.push(`URL sitemap non canonique : ${sourceUrl}`);
    continue;
  }

  const pathname = parsed.pathname;
  allPaths.add(pathname);
  const htmlFile = pageFor(pathname);
  if (!existsSync(htmlFile)) {
    failures.push(`Page absente du build : ${pathname}`);
    continue;
  }
  const html = readFileSync(htmlFile, 'utf8');
  const canonicals = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/gi)].map(m => m[1]);
  if (canonicals.length !== 1 || canonicals[0] !== sourceUrl) {
    failures.push(`Canonical manquante, multiple ou incorrecte : ${pathname}`);
  }
  const robots = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i)?.[1] ?? '';
  if (!robots.includes('index,follow') || /\bnoindex\b/i.test(robots)) {
    failures.push(`Directive robots bloquante : ${pathname}`);
  }
  if (!/<title>[^<]+<\/title>/i.test(html)) failures.push(`Titre manquant : ${pathname}`);
  if (!/<h1(?:\s|>)/i.test(html)) failures.push(`H1 manquant : ${pathname}`);

  // Vérifie les vrais liens de navigation locaux : un chemin finissant par /
  // doit avoir une page construite, qu'il figure ou non au sitemap.
  const internal = [...html.matchAll(/\bhref="(\/[^"#?]*\/)(?:[?#][^"]*)?"/g)].map(m => m[1]);
  for (const href of new Set(internal)) {
    if (!existsSync(pageFor(href))) failures.push(`Lien interne casse depuis ${pathname} : ${href}`);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${urls.length} pages du sitemap, canoniques, robots, titres, H1 et liens internes locaux.`);
}
