import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

test('dated release is repeatable and refuses a future recipe without overwriting it', () => {
  const root = resolve('.');
  const manifest = JSON.parse(readFileSync('releases/amok-trey-v4/manifest.json', 'utf8'));
  const directory = mkdtempSync(join(tmpdir(), 'cdc-amok-packaging-'));
  const run = () => spawnSync(process.execPath, [join(root, 'scripts/package-amok-v4-release.mjs'), directory], { encoding:'utf8' });
  try {
    for (const file of manifest.files) {
      const target = join(directory, file.path);
      mkdirSync(dirname(target), { recursive:true });
      copyFileSync(join(root, 'dist', file.path), target);
    }
    assert.equal(run().status, 0, 'An unchanged release must package again');
    assert.equal(run().status, 0, 'A second packaging must produce the same bytes');
    const recipe = join(directory, 'recettes/amok-trey/index.html');
    const newerRecipe = Buffer.concat([readFileSync(recipe), Buffer.from('\n<!-- Future reviewed recipe -->')]);
    writeFileSync(recipe, newerRecipe);
    const refused = run();
    assert.equal(refused.status, 1);
    assert.match(refused.stderr, /Source recipe changed/);
    assert.deepEqual(readFileSync(recipe), newerRecipe, 'A newer recipe must survive the refused packaging');
  } finally {
    rmSync(directory, { recursive:true, force:true });
  }
});
