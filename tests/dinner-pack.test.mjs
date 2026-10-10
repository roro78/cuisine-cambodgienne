import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPilotDinnerPack, buildPilotDinnerPackText, DINNER_PACK_NOTICE } from '../src/utils/dinnerPack.mjs';

const recipes = [
  {
    slug: 'amok-trey', title: 'Amok Trey', baseServings: 4,
    prepTime: '30 min', cookTime: '25 min',
    ingredients: [
      { quantity: 600, unit: 'g', name: 'poisson blanc' },
      { quantity: 250, unit: 'ml', name: 'lait de coco' },
      { name: 'Feuilles de combava', scalable: false }
    ],
    equipment: ['Panier vapeur', 'Casserole']
  },
  {
    slug: 'chek-ktis', title: 'Chek Ktis', baseServings: 4,
    prepTime: '10 min', cookTime: '15 min',
    ingredients: [
      { quantity: 400, unit: 'ml', name: 'lait de coco' },
      { quantity: 4, name: 'bananes' }
    ],
    equipment: ['Casserole']
  }
];

test('combines the two published sample recipes without external or paid services', () => {
  const result = buildPilotDinnerPack(recipes, 2, '20:00');
  assert.deepEqual(result.menu.map((item) => item.slug), ['amok-trey', 'chek-ktis']);
  assert.equal(result.guests, 2);
  assert.equal(result.serviceTime, '20:00');
  assert.equal(result.notice, DINNER_PACK_NOTICE);
});

test('scales ingredient totals using published base portions', () => {
  const for2 = buildPilotDinnerPack(recipes, 2, '20:00');
  const for4 = buildPilotDinnerPack(recipes, 4, '20:00');
  assert.equal(for2.items.find((item) => item.name === 'lait de coco').quantity, 325);
  assert.equal(for4.items.find((item) => item.name === 'lait de coco').quantity, 650);
  assert.equal(for2.items.find((item) => item.name === 'poisson blanc').quantity, 300);
});

test('keeps ingredients without quantities unmeasured', () => {
  const result = buildPilotDinnerPack(recipes, 6, '20:00');
  const leaves = result.items.find((item) => item.name === 'Feuilles de combava');
  assert.equal(leaves.quantity, null);
  assert.equal(leaves.display, 'Feuilles de combava');
});

test('reuses the indicative scheduling model without pretending to time dessert', () => {
  const result = buildPilotDinnerPack(recipes, 4, '20:00');
  assert.deepEqual(result.timeline.steps.map((item) => item.time), ['18h50', '19h20', '19h35', '20h00']);
  assert.equal(result.timeline.dessertPrepMinutes, 10);
  assert.equal(result.timeline.dessertCookMinutes, 15);
});

test('deduplicates equipment without changing existing recipes', () => {
  const result = buildPilotDinnerPack(recipes, 4, '20:00');
  assert.deepEqual(result.equipment, ['Panier vapeur', 'Casserole']);
  assert.deepEqual(recipes[1].equipment, ['Casserole']);
});

test('downloadable summary is labelled as a free preview, with real public recipe links', () => {
  const text = buildPilotDinnerPackText(buildPilotDinnerPack(recipes, 4, '20:00'));
  assert.match(text, /Nombre de convives : 4/);
  assert.match(text, /650 ml lait de coco/);
  assert.match(text, /18h50/);
  assert.match(text, /recettes\//);
  assert.match(text, /Aperçu gratuit/);
  assert.match(text, /dîner|DINER/i);
  assert.match(text, /Ne jamais goûter/);
  assert.match(text, /Adaptez notamment les ramequins/);
  assert.doesNotMatch(text, /payer maintenant|stripe|réserver votre place/i);
});

test('rejects missing recipes, invalid guest counts and times', () => {
  assert.throws(() => buildPilotDinnerPack(recipes.slice(0, 1), 4, '20:00'), RangeError);
  assert.throws(() => buildPilotDinnerPack({}, 4, '20:00'), TypeError);
  assert.throws(() => buildPilotDinnerPack(recipes, 0, '20:00'), RangeError);
  assert.throws(() => buildPilotDinnerPack(recipes, 2, '18:00'), RangeError);
  assert.throws(() => buildPilotDinnerPackText(null), TypeError);
});


test('optional prahok dish changes the shopping list without changing Amok timing', () => {
  const extra = {
    slug: 'prahok-ktis', title: 'Prahok Ktis', baseServings: 4,
    prepTime: '25 min', cookTime: '25 min',
    ingredients: [
      { quantity: 250, unit: 'ml', name: 'lait de coco' },
      { quantity: 400, unit: 'g', name: 'porc haché' }
    ],
    equipment: ['Poêle']
  };
  const catalogue = [...recipes, extra];
  const plain = buildPilotDinnerPack(catalogue, 4, '20:00');
  const option = buildPilotDinnerPack(catalogue, 4, '20:00', true);
  assert.equal(plain.menu.length, 2);
  assert.equal(option.menu.length, 3);
  assert.equal(option.includeSide, true);
  assert.match(option.notice, /trois recettes publiées/);
  assert.equal(plain.items.find(({ name }) => name === 'lait de coco').quantity, 650);
  assert.equal(option.items.find(({ name }) => name === 'lait de coco').quantity, 900);
  assert.deepEqual(option.timeline.steps, plain.timeline.steps);
  assert.deepEqual(option.equipment, ['Panier vapeur', 'Casserole', 'Poêle']);
  const text = buildPilotDinnerPackText(option);
  assert.match(text, /Prahok Ktis/);
  assert.match(text, /ne sont pas intégrés au planning/);
  assert.throws(() => buildPilotDinnerPack(recipes, 4, '20:00', true), RangeError);
  assert.throws(() => buildPilotDinnerPack(catalogue, 4, '20:00', 'true'), TypeError);
});
