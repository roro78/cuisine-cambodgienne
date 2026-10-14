import assert from 'node:assert/strict';
import fs from 'node:fs';

const home=fs.readFileSync('src/pages/index.astro','utf8');
// The historical V16 contract remains runnable in full on any legacy branch.
// The D8 candidate promotes the different V17 architecture, so validate its
// actual scroll/keyboard guarantees instead of requiring removed V16 elements.
if(!home.includes('V17HomeExperience')){
  await import('./check-motion-v16-contract.mjs');
}else{
  const experience=fs.readFileSync('src/components/V17HomeExperience.astro','utf8');
  const script=fs.readFileSync('src/scripts/v17AccueilMotion.ts','utf8');
  const css=fs.readFileSync('src/styles/v17-accueil-rebuild.css','utf8');
  assert.match(home,/<V17HomeExperience\s*\/>/);
  assert.match(experience,/data-v17r-preview/);
  assert.match(experience,/<SiteHeader\s*\/>/);
  assert.match(experience,/<SiteFooter\s*\/>/);
  assert.equal((experience.match(/<section class="v17r-/g)||[]).length,7,
    'V17 should render seven separate animated editorial scenes');
  assert.match(script,/gsap\.matchMedia\(\)/);
  assert.match(script,/prefers-reduced-motion: no-preference/);
  assert.match(script,/\(min-width: 761px\)/);
  assert.match(script,/scrub: \.75/);
  assert.doesNotMatch(script,/pin:\s*true|ScrollSmoother|window\.scrollTo/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/:focus-visible/);
  assert.match(experience,/href="\/recettes\//);
  assert.match(experience,/href="\/apprendre\//);
  console.log('Motion contract OK — V17 native immersive scroll and reduced-motion');
}
