import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { validateCoralStudioReleaseIntent } from './package-coral-approved-release.mjs';

const ORIGIN = 'https://www.cuisine-du-cambodge.com';
const LIMIT = 400000;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = () => { throw new Error('CORAL_PUBLISHED_PAGE_BASELINE'); };

function sharedPages(intent) {
  const { recipe_slug: recipe } = validateCoralStudioReleaseIntent(intent);
  return [
    ['recettes/' + recipe + '/index.html', '/recettes/' + recipe + '/'],
    ['apprendre/index.html', '/apprendre/'],
    ['sitemap.xml', '/sitemap.xml']
  ];
}

export async function snapshotCoralSharedPages({ intent, directory, fetchPage = fetch }) {
  for (const [path, url] of sharedPages(intent)) {
    const response = await fetchPage(ORIGIN + url, {
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000)
    });
    if (response.status !== 200 || !response.body) fail();
    let size = 0;
    const chunks = [];
    for await (const bytes of response.body) {
      size += bytes.length;
      if (size > LIMIT) fail();
      chunks.push(bytes);
    }
    if (!size) fail();
    const destination = join(directory, path);
    await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
    await writeFile(destination, Buffer.concat(chunks), { flag: 'wx', mode: 0o600 });
  }
}

function unique(items) {
  if (items.length !== 1) fail();
  return items[0];
}

function insertAt(text, offset, addition) {
  if (offset < 0) fail();
  return text.slice(0, offset) + addition + text.slice(offset);
}

export async function preserveCoralSharedPages({ intent, directory, dist }) {
  const url = '/apprendre/pratique/' + intent.candidate_public_slug + '/';
  const link = 'href="' + url + '"';
  const pages = sharedPages(intent);
  const baseline = {};
  const writes = [];
  for (const [path] of pages) {
    const bytes = await readFile(join(directory, path));
    const text = bytes.toString('utf8');
    if (!bytes.length || bytes.length > LIMIT || !bytes.equals(Buffer.from(text)) ||
        text.includes(path === 'sitemap.xml' ? '<loc>' + ORIGIN + url + '</loc>' : link))
      fail();
    const target = join(dist, path);
    const generated = await readFile(target, 'utf8');
    let next;
    if (path === 'apprendre/index.html') {
      const card = unique([...generated.matchAll(/<article class="v16-workshop"[^>]*>[\s\S]*?<\/article>/g)]
        .map(match => match[0]).filter(article => article.includes(link)));
      const list = unique([...text.matchAll(/<section class="v16-workshop-list" aria-label="Ateliers de cuisine complets">[\s\S]*?<\/section>/g)]);
      const nextNumber = [...list[0].matchAll(/<article class="v16-workshop"/g)].length + 1;
      const numbered = card.replace(/(<div class="v16-workshop-number">)\d+(<\/div>)/,
        (_, open, close) => open + String(nextNumber).padStart(2, '0') + close);
      next = insertAt(text, list.index + list[0].lastIndexOf('</section>'), numbered);
    } else if (path === 'sitemap.xml') {
      const entry = unique([...generated.matchAll(/<url>[\s\S]*?<\/url>/g)].map(match => match[0])
        .filter(item => item.includes('<loc>' + ORIGIN + url + '</loc>')));
      if (text.split('</urlset>').length !== 2) fail();
      next = insertAt(text, text.indexOf('</urlset>'), '  ' + entry + '\n');
    } else {
      const sectionPattern = /<section class="recipe-workshops" aria-label="Préparer la recette dans un atelier complet">[\s\S]*?<\/section>/g;
      const block = unique([...generated.matchAll(sectionPattern)].map(match => match[0])
        .filter(section => section.includes(link)));
      const existing = [...text.matchAll(sectionPattern)];
      if (existing.length) {
        const old = unique(existing);
        const a = unique([...block.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0])
          .filter(anchor => anchor.includes(link)));
        next = insertAt(text, old.index + old[0].lastIndexOf('</div>'), a);
      } else {
        const anchor = '<aside class="glossary-strip" aria-labelledby="glossary-title"';
        if (text.split(anchor).length !== 2) fail();
        next = insertAt(text, text.indexOf(anchor), block + ' ');
      }
    }
    baseline[path] = sha(bytes);
    writes.push([target, next]);
  }
  for (const [target, bytes] of writes) await writeFile(target, bytes);
  return baseline;
}
