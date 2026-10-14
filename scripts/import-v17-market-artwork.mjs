#!/usr/bin/env node
/**
 * V17 — Import strict de l'illustration IA du marché terrestre.
 *
 * Usage :
 *   node scripts/import-v17-market-artwork.mjs chemin/vers/v17-marche-cambodgien-ia.webp
 *
 * The approved file is deliberately not fetched from an external URL. Import
 * the supplied generated image locally, preserving exact bytes/provenance.
 */
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';

const expected='f6556fcfdf3de5159e12083d40cf96872a1000d956b1e2eb9874f8bec272721b';
const source=process.argv[2];
if(!source){
  console.error('Usage: node scripts/import-v17-market-artwork.mjs <fichier-webp-approuve>');
  process.exit(2);
}
const path=resolve(source);
const destination=resolve('public/images/cuisine/v17-marche-cambodgien-ia.webp');
const bytes=readFileSync(path);
assert.equal(bytes.subarray(0,4).toString(),'RIFF','Not a RIFF WebP image');
assert.equal(bytes.subarray(8,12).toString(),'WEBP','Not a WebP image');
assert.ok(bytes.length>100_000 && bytes.length<1_000_000,'Unexpected image file size');
const sha256=createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256,expected,'Unapproved artwork: supplied WebP differs from visual accepted in chat');
mkdirSync(dirname(destination),{recursive:true});
if(path!==destination)copyFileSync(path,destination);
assert.equal(statSync(destination).size,bytes.length);
console.log('V17_MARKET_ASSET = READY');
console.log('PUBLIC_PATH = /images/cuisine/v17-marche-cambodgien-ia.webp');
console.log('SHA256 = '+sha256);
console.log('Next: git add public/images/cuisine/v17-marche-cambodgien-ia.webp && run the V17 CI.');
