#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { chmod, link, lstat, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const maxJpegBytes = 8 * 1024 * 1024;

async function verifiedFile(path, entry) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.size !== entry.bytes || await realpath(path) !== path) {
    throw new Error(`media_file_invalid:${entry.sha256}`);
  }
  const data = await readFile(path);
  if (data.length !== entry.bytes || digest(data) !== entry.sha256) {
    throw new Error(`media_digest_mismatch:${entry.sha256}`);
  }
  return data;
}

export async function installSocialMediaAssets(bundleDir, destinationDir) {
  const bundle = await realpath(bundleDir);
  const destination = resolve(destinationDir);
  const destinationStat = await lstat(destination);
  if (!destinationStat.isDirectory() || await realpath(destination) !== destination) {
    throw new Error('media_destination_not_real_directory');
  }
  if (bundle === destination || destination.startsWith(bundle + '/') || bundle.startsWith(destination + '/')) {
    throw new Error('media_bundle_and_destination_overlap');
  }
  const manifest = JSON.parse(await readFile(join(bundle, 'manifest.json'), 'utf8'));
  if (manifest?.product !== 'cuisine-du-cambodge' || manifest.schemaVersion !== 1 ||
      !Array.isArray(manifest.entries) || !manifest.entries.length || manifest.entries.length > 1000) {
    throw new Error('media_manifest_invalid');
  }

  const entries = new Map();
  for (const entry of manifest.entries) {
    if (!/^[a-f0-9]{64}$/.test(entry?.sha256 ?? '') || entry.path !== `assets/${entry.sha256}.jpg` ||
        !Number.isSafeInteger(entry.bytes) || entry.bytes < 1 || entry.bytes > maxJpegBytes ||
        (entries.has(entry.sha256) && entries.get(entry.sha256).bytes !== entry.bytes)) {
      throw new Error('media_manifest_entry_invalid');
    }
    entries.set(entry.sha256, entry);
  }

  // Stage outside the served directory on the same filesystem. A file appears
  // at its public URL only once its complete, verified bytes are ready.
  const staging = await mkdtemp(join(dirname(destination), '.cdc-social-media-'));
  try {
    if ((await lstat(staging)).dev !== destinationStat.dev) throw new Error('media_destination_cross_device');
    for (const entry of entries.values()) {
      const name = `${entry.sha256}.jpg`;
      const finalPath = join(destination, name);
      const bytes = await verifiedFile(join(bundle, entry.path), entry);
      try {
        await verifiedFile(finalPath, entry);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      const stagedPath = join(staging, name);
      await writeFile(stagedPath, bytes, { flag: 'wx', mode: 0o644 });
      await chmod(stagedPath, 0o644);
    }

    let added = 0;
    for (const entry of entries.values()) {
      const name = `${entry.sha256}.jpg`;
      const finalPath = join(destination, name);
      try {
        await link(join(staging, name), finalPath);
        added++;
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        await verifiedFile(finalPath, entry);
      }
    }
    return { added, verified: entries.size };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    if (process.argv.length !== 4) throw new Error('Usage: install-social-media-assets.mjs BUNDLE_DIR EXISTING_ASSETS_DIR');
    const result = await installSocialMediaAssets(process.argv[2], process.argv[3]);
    console.log('SOCIAL_MEDIA_ASSETS_READY', JSON.stringify(result));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
