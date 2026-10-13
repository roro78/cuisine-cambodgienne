/**
 * V17 preview only — acquire specific, source-verified photographs.
 * Run in a disposable GitHub Actions worker. Commit assets to the V17
 * development branch only; never deploy/merge or touch production.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const assets = [
  {
    path: 'public/images/cuisine/v17-market-live-1800.jpg',
    commonsTitle: 'File:Market in Phnom Penh.jpg',
    width: 1800,
    credit: 'Radosław Botev / Fundacja Nomos — CC BY 3.0 PL',
  },
  {
    path: 'public/images/cuisine/v17-angkor-dusk-1800.jpg',
    commonsTitle: 'File:Angkor Wat at dusk, Siem Reap, Cambodia.jpg',
    width: 1800,
    credit: 'Eric Hossinger — CC BY 2.0',
  },
  {
    path: 'public/images/cuisine/v17-mortar-hands-1600.jpg',
    url: 'https://images.pexels.com/photos/21937648/pexels-photo-21937648.jpeg?auto=compress&cs=tinysrgb&w=1600',
    credit: 'Filipp Romanovski — Pexels License (generic mortar demonstration; not identified as Cambodian)',
  },
  {
    path: 'public/images/cuisine/v17-table-meal-1600.jpg',
    commonsTitle: 'File:Khmer Family Restaurant, 2018 (03).jpg',
    width: 1600,
    credit: 'Bahnfrend — CC BY-SA 4.0 (actual photographed meal in Siem Reap)',
  },
];

async function getCommonsUrl(title, width) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', prop: 'imageinfo',
    iiprop: 'url', iiurlwidth: String(width), titles: title
  });
  const url = 'https://commons.wikimedia.org/w/api.php?' + params;
  const res = await fetch(url, { headers: { 'User-Agent': 'CuisineDuCambodge-V17AssetReview/1.0 (public Wikimedia content, noncommercial review)' } });
  if (!res.ok) throw new Error(title + ': Commons API HTTP ' + res.status);
  const json = await res.json();
  const item = Object.values(json.query?.pages || {})[0];
  const info = item?.imageinfo?.[0];
  if (!info?.thumburl && !info?.url) throw new Error(title + ': no image URL');
  return info.thumburl || info.url;
}

async function download(entry) {
  const endpoint = entry.commonsTitle ? await getCommonsUrl(entry.commonsTitle, entry.width) : entry.url;
  const response = await fetch(endpoint, { headers: { 'User-Agent': 'CuisineDuCambodge-V17AssetReview/1.0 (image license attributed on homepage)' }, signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(entry.path + ': HTTP ' + response.status);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 30_000 || bytes.length > 12_000_000) throw new Error(entry.path + ': unexpected size ' + bytes.length);
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new Error(entry.path + ': not a JPEG');
  await fs.mkdir(path.dirname(entry.path), { recursive: true });
  await fs.writeFile(entry.path, bytes);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  console.log(JSON.stringify({ file:entry.path,bytes:bytes.length,sha256,credit:entry.credit,source:endpoint }));
}
for (const entry of assets) await download(entry);
console.log('V17 licensed photo inventory acquired: ' + assets.length);
