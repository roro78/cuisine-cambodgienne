import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PILOT_GUIDE_SLUGS,
  AMOK_RAW_EGG_CAUTION,
  buildPilotKitchenGuide,
  readGuideStep,
  getGuideCompletedCount
} from '../src/utils/dinnerKitchenGuide.mjs';

const source = [
  {
    slug: 'amok-trey',
    title: 'Amok Trey',
    intro: 'Poisson au coco',
    steps: [
      { title: 'Préparer la base', text: 'Mélangez le kroeung et le lait de coco.', cue: 'Base lisse.' },
      { title: 'Assaisonner', text: 'Ajoutez les œufs battus. Goûtez avant le poisson.', mistake: 'Assaisonner tôt.' },
      { title: 'Cuire doucement', text: 'Cuisez doucement à la vapeur.', duration: '18–25 min' },
    ],
  },
  {
    slug: 'chek-ktis',
    title: 'Chek Ktis',
    intro: 'Bananes coco',
    steps: [
      { title: 'Chauffer le coco', text: 'Chauffez doucement.' },
      { title: 'Servir tiède', text: 'Servez.' }
    ]
  }
];

test('guide uses exactly the two already published pilot recipes', () => {
  const dishes = buildPilotKitchenGuide(source);
  assert.deepEqual(dishes.map((dish) => dish.slug), PILOT_GUIDE_SLUGS);
  assert.deepEqual(dishes.map((dish) => dish.steps.length), [3, 2]);
});

test('guide carries real source steps and sensory cues without inventing extra steps', () => {
  const dishes = buildPilotKitchenGuide(source);
  assert.equal(dishes[0].steps[0].text, source[0].steps[0].text);
  assert.equal(dishes[0].steps[0].cue, 'Base lisse.');
  assert.equal(dishes[1].steps[0].title, 'Chauffer le coco');
  assert.equal(dishes[1].steps[0].mistake, null);
});

test('guide corrects the misleading raw-egg tasting instruction without modifying recipe source', () => {
  const dishes = buildPilotKitchenGuide(source);
  assert.equal(dishes[0].steps[1].text, AMOK_RAW_EGG_CAUTION);
  assert.match(dishes[0].steps[1].text, /AVANT d’incorporer les œufs crus/);
  assert.match(dishes[0].steps[1].text, /Ne goûtez pas/);
  assert.equal(source[0].steps[1].text, 'Ajoutez les œufs battus. Goûtez avant le poisson.');
});

test('different recipe steps have unique stable identifiers for in-page state', () => {
  const dishes = buildPilotKitchenGuide(source);
  const keys = dishes.flatMap((dish) => dish.steps.map((step) => step.id));
  assert.equal(new Set(keys).size, keys.length);
});

test('readGuideStep reports position within each recipe', () => {
  const dishes = buildPilotKitchenGuide(source);
  const result = readGuideStep(dishes, 'chek-ktis', 1);
  assert.equal(result.dish.title, 'Chek Ktis');
  assert.equal(result.position, 2);
  assert.equal(result.total, 2);
  assert.equal(result.step.title, 'Servir tiède');
});

test('completed progress counts only steps for the selected dish', () => {
  const dishes = buildPilotKitchenGuide(source);
  const completed = new Set([dishes[0].steps[0].id, dishes[0].steps[1].id, dishes[1].steps[0].id]);
  assert.equal(getGuideCompletedCount(dishes[0], completed), 2);
  assert.equal(getGuideCompletedCount(dishes[1], completed), 1);
});

test('invalid steps, incomplete source and malformed progress are rejected', () => {
  const dishes = buildPilotKitchenGuide(source);
  for (const index of [-1, 1.5, 5]) assert.throws(() => readGuideStep(dishes, 'amok-trey', index), RangeError);
  assert.throws(() => readGuideStep(dishes, 'unknown', 0), RangeError);
  assert.throws(() => buildPilotKitchenGuide([source[0]]), RangeError);
  assert.throws(() => buildPilotKitchenGuide([source[0], { ...source[1], steps: [] }]), RangeError);
  assert.throws(() => getGuideCompletedCount(dishes[0], []), TypeError);
});
