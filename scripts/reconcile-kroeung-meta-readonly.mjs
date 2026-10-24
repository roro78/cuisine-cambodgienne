#!/usr/bin/env node
/**
 * Cuisine du Cambodge — Kroeung publication inventory (READ ONLY).
 *
 * One-shot Graph GET audit. Never issues POST/PUT/PATCH/DELETE or modifies n8n,
 * PostgreSQL, Facebook, Instagram or any credential. No files are written.
 *
 * Run using an ephemeral Page token in META_PAGE_ACCESS_TOKEN. Never print the token.
 * Exit with BLOCKED if results are partial/ambiguous; absence of matches never
 * authorizes reposting, DB reset or workflow activation.
 */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

export const PAGE_ID = '206899719342067';
export const VERSION = 'v26.0';
export const SINCE = Date.parse('2026-10-20T00:00:00Z');

const allowedHostname = 'graph.facebook.com';
const defaultFetch = (...args) => fetch(...args);
const safeError = (err) => {
  if (err?.name === 'AbortError' || err?.name === 'TimeoutError') return 'TIMEOUT';
  if (/^Meta_HTTP_[0-9]{3}$/.test(String(err?.message))) return String(err.message);
  if (/^UNSAFE_PAGINATION$/.test(String(err?.message))) return 'UNSAFE_PAGINATION';
  if (/^INVALID_META_RESPONSE$/.test(String(err?.message))) return 'INVALID_META_RESPONSE';
  return 'NETWORK_OR_API_ERROR';
};
const graphUrl = (path, query = {}) => {
  const url = new URL('https://' + allowedHostname + '/' + VERSION + '/' + path);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
  return url;
};
const checkUrl = (input) => {
  const url = new URL(String(input));
  assert.ok(url.protocol === 'https:' && url.hostname === allowedHostname &&
    url.port === '' && !url.username && !url.password && !url.hash,
    'UNSAFE_PAGINATION');
  assert.ok(url.pathname.startsWith('/' + VERSION + '/'), 'UNSAFE_PAGINATION');
  // Paging URLs returned by Graph can contain the token. Remove it and use only
  // the Authorization header; do not ever print the original URL.
  url.searchParams.delete('access_token');
  url.searchParams.delete('appsecret_proof');
  return url;
};
export async function graphGet(urlInput, token, fetcher = defaultFetch) {
  const url = checkUrl(urlInput);
  assert.ok(typeof token === 'string' && token.length > 8, 'MISSING_PAGE_TOKEN');
  try {
    const response = await fetcher(url.toString(), {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(14000),
    });
    if (!response || !Number.isInteger(response.status)) throw Error('INVALID_META_RESPONSE');
    if (!response.ok) throw Error('Meta_HTTP_' + response.status);
    const data = await response.json();
    if (data === null || typeof data !== 'object') throw Error('INVALID_META_RESPONSE');
    return data;
  } catch (err) {
    throw Error(safeError(err));
  }
}
const recent = (item, kind, start) => {
  const timestamp = kind === 'ig' ? item.timestamp : item.created_time;
  const when = Date.parse(String(timestamp || ''));
  return Number.isFinite(when) && when >= start;
};
const containsKroeung = (item, kind) => {
  const caption = kind === 'photo' ? item.name : kind === 'ig' ? item.caption : item.message;
  return /\b(kroeung|krueng|krung)\b|គ្រឿង/i.test(String(caption || ''));
};
const summaryItem = (item, kind) => {
  const ref = kind === 'post' ? item.permalink_url : kind === 'photo' ? item.link : item.permalink;
  const date = kind === 'ig' ? item.timestamp : item.created_time;
  return { id: String(item.id || ''), date: String(date || ''), link: typeof ref === 'string' ? ref : null,
    textPresent: Boolean(kind === 'photo' ? item.name : kind === 'ig' ? item.caption : item.message) };
};
export async function scanEdge({ url, kind, token, fetcher = defaultFetch, since = SINCE, maxPages = 30 }) {
  assert.ok(['post','photo','ig'].includes(kind), 'Unexpected edge');
  assert.ok(Number.isSafeInteger(maxPages) && maxPages > 0 && maxPages <= 50);
  let next = checkUrl(url);
  let pages = 0;
  let scanned = 0;
  let stale = 0;
  const matches = [];
  const recentItems = [];
  const visited = new Set();
  while (next && pages < maxPages) {
    const key = next.toString();
    if (visited.has(key)) throw Error('UNSAFE_PAGINATION');
    visited.add(key);
    const page = await graphGet(next, token, fetcher);
    if (!Array.isArray(page.data)) throw Error('INVALID_META_RESPONSE');
    pages++;
    scanned += page.data.length;
    for (const item of page.data) {
      if (!recent(item, kind, since)) { stale++; continue; }
      const metadata = summaryItem(item, kind);
      recentItems.push(metadata);
      if (containsKroeung(item, kind)) matches.push(metadata);
    }
    next = page.paging?.next ? checkUrl(page.paging.next) : null;
  }
  return {
    state: next ? 'TRUNCATED' : 'COMPLETE',
    pages, scanned, olderOrMissingDate: stale,
    recentCount: recentItems.length,
    candidates: matches,
    // All recent identifiers shown because some photos have missing captions.
    recentRecords: recentItems.slice(0, 200),
    recentRecordsTruncated: recentItems.length > 200,
  };
}
export async function auditMeta({
  token, pageId = PAGE_ID, fetcher = defaultFetch, maxPages = 30,
} = {}) {
  assert.equal(pageId, PAGE_ID, 'Unexpected Page ID');
  assert.ok(typeof token === 'string' && token.length > 8, 'MISSING_PAGE_TOKEN');
  const result = {
    schema: 'cuisine-kroeung-meta-inventory-v1',
    mode: 'GRAPH_GET_ONLY',
    since: new Date(SINCE).toISOString(),
    pageId,
    pageIdentity: 'BLOCKED',
    instagramLink: 'BLOCKED',
    facebookPublishedPosts: { state: 'NOT_TESTED' },
    facebookUploadedPhotos: { state: 'NOT_TESTED' },
    instagramMedia: { state: 'NOT_TESTED' },
    writesPerformed: false,
    verdict: 'BLOCKED',
    warning: 'An empty search never proves absence across every Meta publishing mode. Do not reset Kroeung or republish automatically.',
  };
  let page;
  try {
    page = await graphGet(graphUrl(pageId, {
      fields: 'id,name,instagram_business_account{id,username}',
    }), token, fetcher);
    if (String(page.id || '') !== pageId) throw Error('PAGE_MISMATCH');
    result.pageIdentity = 'PASS';
  } catch (err) {
    result.pageIdentity = safeError(err) === 'NETWORK_OR_API_ERROR' &&
      err?.message === 'PAGE_MISMATCH' ? 'PAGE_MISMATCH' : safeError(err);
    return result;
  }
  const edges = [
    ['facebookPublishedPosts', 'post', graphUrl(pageId + '/published_posts',
      { fields: 'id,message,created_time,permalink_url', limit: 100, since: Math.floor(SINCE / 1000) })],
    ['facebookUploadedPhotos', 'photo', graphUrl(pageId + '/photos',
      { type: 'uploaded', fields: 'id,name,created_time,link', limit: 100, since: Math.floor(SINCE / 1000) })],
  ];
  for (const [label,kind,url] of edges) {
    try {
      result[label] = await scanEdge({ url, kind, token, fetcher, maxPages });
    } catch (err) {
      result[label] = { state: 'BLOCKED', reason: safeError(err) };
    }
  }
  const igId = String(page.instagram_business_account?.id || '');
  if (/^[0-9]+$/.test(igId)) {
    result.instagramLink = 'PASS';
    try {
      result.instagramMedia = await scanEdge({
        url: graphUrl(igId + '/media',
          { fields: 'id,caption,timestamp,permalink,media_type', limit: 100 }),
        kind: 'ig', token, fetcher, maxPages,
      });
    } catch (err) {
      result.instagramMedia = { state: 'BLOCKED', reason: safeError(err) };
    }
  } else {
    result.instagramLink = 'NOT_AVAILABLE_FROM_PAGE';
  }
  const scans = [result.facebookPublishedPosts,result.facebookUploadedPhotos,result.instagramMedia];
  const candidates = scans.reduce((sum,s) => sum + (s.candidates?.length || 0), 0);
  result.candidateCount = candidates;
  result.verdict = scans.every(s => s.state === 'COMPLETE') && result.instagramLink === 'PASS'
    ? (candidates ? 'POSSIBLE_DUPLICATE_REVIEW' : 'NO_KEYWORD_CANDIDATE_IN_SCANNED_EDGES')
    : 'BLOCKED_INCOMPLETE_INVENTORY';
  return result;
}
const main = async () => {
  let output;
  try {
    output = await auditMeta({token: process.env.META_PAGE_ACCESS_TOKEN});
  } catch (err) {
    output = {mode:'GRAPH_GET_ONLY',writesPerformed:false,verdict:'BLOCKED',
      reason: safeError(err) === 'NETWORK_OR_API_ERROR' && err?.message === 'MISSING_PAGE_TOKEN'
        ? 'MISSING_PAGE_TOKEN' : safeError(err)};
  }
  // Entire report excludes tokens and full unpublished draft captions.
  console.log(JSON.stringify(output, null, 2));
  if (output.verdict === 'BLOCKED' || output.verdict?.startsWith('BLOCKED_')) process.exitCode = 2;
};
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
