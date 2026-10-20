/**
 * Adapts the SIX new culinary chapters to the already existing OpenAI
 * Coral generator from feat/atelier-immersif-audio-guide-20261017.
 * No TTS implementation here. No calls to Render, Squaia, n8n or Meta.
 * The old generator is executed ONLY inside a disposable .tmp- workspace.
 * The fake "mortier" label is private to the temporary workspace: it maps
 * its explicit narration JSON to the new atelier; no historical file is edited.
 *
 * Usage: node scripts/bridge-guided-tamarin-existing-coral.mjs --prepare
 *        node scripts/bridge-guided-tamarin-existing-coral.mjs --assemble
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const mode = process.argv[2];
const temp = resolve('.tmp-guided-coral-once');
const output = resolve('public/audio/workshops/pratique-sauce-tamarin/atelier-coral.mp3');
const manifestPath = resolve('src/data/guided-workshop-audio/sauce-tamarin.json');
const items = ['intro', 'etape-01', 'etape-02', 'etape-03', 'etape-04', 'etape-05', 'etape-06'];
const sourceScript = join(temp, 'scripts/generate-workshop-audio.mjs');

if (mode === '--prepare') {
  if (existsSync(temp)) throw new Error('Temporary directory already exists; refusing to reuse it.');
  if (existsSync(output) || existsSync(manifestPath)) throw new Error('The new MP3 already exists; refusing regeneration.');
  const plan = JSON.parse(execFileSync(process.execPath, ['scripts/export-guided-workshop-narration.mjs'], { encoding: 'utf8' }));
  if (plan.atelier !== 'pratique:sauce-tamarin' || plan.chapters.length !== 6 || plan.voice !== 'coral') {
    throw new Error('Only the explicitly validated six-chapter sauce-tamarin pilot is allowed.');
  }
  if (plan.chapters.some((c, i) => c.index !== i + 1 || !c.text || c.text.length < 80)) {
    throw new Error('Incomplete or non-sequential narration chapters.');
  }
  mkdirSync(join(temp, 'scripts'), { recursive: true });
  mkdirSync(join(temp, 'src/data'), { recursive: true });
  const virtual = [
    {
      slug: 'piler-aromates-au-mortier',
      title: 'Préparer et équilibrer une sauce au tamarin',
      steps: plan.chapters.map(c => ({ title: c.title, action: c.text, observe: '', cue: '', success: '' }))
    },
    ...Array.from({ length: 5 }, (_, i) => ({
      slug: 'unused-legacy-placeholder-' + (i + 1),
      title: 'Unused temporary placeholder',
      steps: [{ title: 'Unused', action: 'unused', observe: '', cue: '', success: '' }]
    }))
  ];
  writeFileSync(join(temp, 'src/data/workshops.ts'), 'export const workshops = ' + JSON.stringify(virtual) + ';\n');
  writeFileSync(join(temp, 'src/data/workshop-mortier-narration.json'), JSON.stringify({
    intro: 'Bienvenue dans cet atelier consacré à la sauce au tamarin. Nous allons préparer une sauce à partir de sa pulpe, puis goûter plusieurs équilibres. Préparez votre matériel, avancez à votre rythme et mettez la narration en pause lorsque vous cuisinez.',
    steps: plan.chapters.map(c => c.text)
  }, null, 2) + '\n');
  const count = readFileSync(join(temp, 'src/data/workshop-mortier-narration.json'), 'utf8');
  if (JSON.parse(count).steps.length !== 6) throw new Error('Intro and six steps required.');
  console.log('Guided tamarind adapter PASS: seven tracks prepared for the existing generator, no TTS calls.');
  console.log('The legacy generator script must be loaded separately into ' + sourceScript);
} else if (mode === '--assemble') {
  if (!existsSync(sourceScript)) throw new Error('Existing generator not supplied.');
  if (existsSync(output) || existsSync(manifestPath)) throw new Error('Audio already exists: refusing overwrite.');
  const folder = join(temp, 'public/audio/workshops/piler-aromates-au-mortier');
  const srcs = items.map(n => join(folder, n + '.mp3'));
  for (const f of srcs) {
    if (!existsSync(f)) throw new Error('A Coral track is missing: ' + f);
    const buffer = readFileSync(f);
    if (buffer.length < 1024 || !(buffer.subarray(0,3).toString() === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0))) {
      throw new Error('Invalid MP3 chunk: ' + f);
    }
  }
  const probe = f => {
    const raw = execFileSync('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',f], { encoding:'utf8' });
    const seconds = Number(raw.trim());
    if (!(seconds > 0) || !Number.isFinite(seconds)) throw new Error('Invalid ffprobe duration for ' + f);
    return seconds;
  };
  const seconds = srcs.map(probe);
  const concatFile = join(temp, 'concat.txt');
  writeFileSync(concatFile, srcs.map(s => "file '" + s.replaceAll("'", "'\\''") + "'").join('\n') + '\n');
  mkdirSync(resolve('public/audio/workshops/pratique-sauce-tamarin'), { recursive: true });
  execFileSync('ffmpeg', ['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',concatFile,'-c','copy',output], { stdio:'inherit' });
  const total = probe(output);
  const sourceTotal = seconds.reduce((a, b) => a + b, 0);
  if (Math.abs(total - sourceTotal) > 1.5) {
    throw new Error('Measured MP3 duration differs from the real segments.');
  }
  const plan = JSON.parse(execFileSync(process.execPath, ['scripts/export-guided-workshop-narration.mjs'], { encoding:'utf8' }));
  let cursor = 0;
  const chapters = srcs.map((_, i) => {
    const begin = cursor;
    cursor += seconds[i];
    return {
      id: i === 0 ? 'intro' : plan.chapters[i - 1].id,
      title: i === 0 ? 'Bienvenue dans l’atelier' : plan.chapters[i - 1].title,
      startSec: Math.round(begin * 1000) / 1000,
      endSec: Math.round(cursor * 1000) / 1000
    };
  });
  const bytes = readFileSync(output);
  const manifest = {
    atelier: 'pratique:sauce-tamarin',
    status: 'audio_generated_review_pending',
    sourceGenerator: 'feat/atelier-immersif-audio-guide-20261017:scripts/generate-workshop-audio.mjs',
    model: 'gpt-4o-mini-tts',
    voice: 'coral',
    audioUrl: '/audio/workshops/pratique-sauce-tamarin/atelier-coral.mp3',
    durationSec: Math.round(total * 1000) / 1000,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    chapters,
    review: { acousticListening: false, mobile: false, desktop: false }
  };
  mkdirSync(resolve('src/data/guided-workshop-audio'), { recursive:true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log('NEW GUIDED CORAL MP3 WRITTEN; chapter boundaries measured by ffprobe.');
  console.log('durationSec=' + manifest.durationSec + ' bytes=' + bytes.length + ' sha256=' + manifest.sha256.slice(0,12));
} else {
  throw new Error('Use --prepare or --assemble. No TTS calls occur within this adapter.');
}
