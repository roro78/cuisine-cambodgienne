import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts', 'preview-workshop-voice.mjs');
const env = { ...process.env, OPENAI_API_KEY: '' };

function run(...args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: root, env, encoding: 'utf8', timeout: 15000
  });
}

test('dry-run gratuit par defaut, voix feminine OpenAI', () => {
  const r = run();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /AUCUN APPEL API/);
  assert.match(r.stdout, /gpt-4o-mini-tts/);
  assert.match(r.stdout, /shimmer/);
});

test('autre voix feminine proposee sans appel payant', () => {
  const r = run('--voice=coral');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /coral/);
});

test('generation explicite impossible sans OPENAI_API_KEY', () => {
  const r = run('--generate');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /OPENAI_API_KEY absente|MP3 d’essai deja present/);
});

test('garde-fous avant cout : argument, combinaison et voix invalides', () => {
  for (const args of [
    ['--generate', '--dry-run'],
    ['--voice=unknown', '--generate'],
    ['--provider=elevenlabs', '--generate'],
    ['--max-previews=99', '--generate']
  ]) {
    const r = run(...args);
    assert.notEqual(r.status, 0, args.join(' '));
  }
});
