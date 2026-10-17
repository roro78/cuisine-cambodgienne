import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts', 'preview-workshop-voice.mjs');
const env = { ...process.env, ELEVENLABS_API_KEY: '', OPENAI_API_KEY: '' };

function run(...args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: root, env, encoding: 'utf8', timeout: 15000
  });
}

test('default is a cost-free dry-run for original voice', () => {
  const r = run();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /DRY RUN - 0 appel API/);
  assert.match(r.stdout, /Voice Design/);
});

test('OpenAI comparison stays a dry-run by default', () => {
  const r = run('--provider=openai', '--voice=marin');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /voix existante, non originale/);
});

test('explicit generation requires ElevenLabs credentials', () => {
  const r = run('--generate');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /ELEVENLABS_API_KEY absente|Prototype deja present/);
});

test('explicit OpenAI generation requires credentials', () => {
  const r = run('--generate', '--provider=openai');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /OPENAI_API_KEY absente|Prototype deja present/);
});

test('invalid safety options stop before any API call', () => {
  for (const args of [
    ['--generate', '--dry-run'],
    ['--provider=unknown', '--generate'],
    ['--max-previews=50', '--generate'],
    ['--provider=openai', '--voice=unknown', '--generate']
  ]) {
    const r = run(...args);
    assert.notEqual(r.status, 0, args.join(' '));
  }
});
