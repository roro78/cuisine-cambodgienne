import test from 'node:test';
import assert from 'node:assert/strict';
import { PILOT_SLUGS, buildPilotShoppingList, buildShoppingListText, formatPreviewQuantity } from '../src/utils/dinnerPreview.mjs';

const fixtures = [
  {
    title: 'Amok Trey',
    baseServings: 4,
    ingredients: [
      { quantity: 250, unit: 'ml', name: 'lait de coco' },
      { quantity: 600, unit: 'g', name: 'poisson blanc ferme' },
      { quantity: 2, name: 'œufs' },
      { name: 'Basilic thaï ou basilic asiatique', scalable: false }
    ]
  },
  {
    title: 'Chek Ktis',
    baseServings: 4,
    ingredients: [
      { quantity: 400, unit: 'ml', name: 'lait de coco' },
      { quantity: 4, name: 'bananes pas trop mûres' },
      { quantity: 1, unit: 'pincée', name: 'sel', scalable: false }
    ]
  }
];

test('pilot menu uses only published recipe slugs', () => {
  assert.deepEqual(PILOT_SLUGS, ['amok-trey', 'chek-ktis']);
});

test('aggregates repeated ingredients with the same measurement unit', () => {
  const list = buildPilotShoppingList(fixtures, 4);
  const coco = list.filter(({ name }) => name === 'lait de coco');
  assert.equal(coco.length, 1);
  assert.equal(coco[0].quantity, 650);
  assert.deepEqual(coco[0].dishes, ['Amok Trey', 'Chek Ktis']);
});

test('scales source quantities correctly for 2, 4 and 6 diners', () => {
  const expected = new Map([[2, [325, 300, 2]], [4, [650, 600, 4]], [6, [975, 900, 6]]]);
  for (const [diners, [coco, fish, banana]] of expected) {
    const items = buildPilotShoppingList(fixtures, diners);
    assert.equal(items.find((item) => item.name === 'lait de coco').quantity, coco);
    assert.equal(items.find((item) => item.name === 'poisson blanc ferme').quantity, fish);
    assert.equal(items.find((item) => item.name === 'bananes pas trop mûres').quantity, banana);
  }
});

test('keeps quantities marked non-scalable unchanged', () => {
  const at2 = buildPilotShoppingList(fixtures, 2).find((item) => item.name === 'sel');
  const at6 = buildPilotShoppingList(fixtures, 6).find((item) => item.name === 'sel');
  assert.equal(at2.quantity, 1);
  assert.equal(at6.quantity, 1);
});

test('preserves unquantified ingredients without made-up portions', () => {
  const list = buildPilotShoppingList(fixtures, 6);
  const basil = list.find((item) => item.name.startsWith('Basilic'));
  assert.equal(basil.quantity, null);
  assert.equal(basil.display, 'Basilic thaï ou basilic asiatique');
});

test('formats decimal portions with French conventions and prevents invalid quantities', () => {
  assert.equal(formatPreviewQuantity(0.75), '0,75');
  assert.equal(formatPreviewQuantity(2.5), '2,5');
  assert.throws(() => formatPreviewQuantity(-1), RangeError);
  assert.throws(() => formatPreviewQuantity(Number.POSITIVE_INFINITY), RangeError);
});

test('does not accept invalid diner counts or recipe base portions', () => {
  for (const guestCount of [0, -1, 1.5, 13, Number.NaN]) {
    assert.throws(() => buildPilotShoppingList(fixtures, guestCount), RangeError);
  }
  assert.throws(() => buildPilotShoppingList([{ ...fixtures[0], baseServings: 0 }], 4), RangeError);
});

test('copyable list is labelled as demonstration, not a paid product', () => {
  const text = buildShoppingListText(buildPilotShoppingList(fixtures, 4), 4);
  assert.match(text, /Pour 4 personnes/);
  assert.match(text, /650 ml lait de coco/);
  assert.match(text, /recettes gratuites/);
  assert.match(text, /en préparation/);
});


test('copy text lists three free recipes only when the optional side is selected', () => {
  const menu = ['Amok Trey', 'Chek Ktis', 'Prahok Ktis'];
  const text = buildShoppingListText(buildPilotShoppingList(fixtures, 4), 4, menu);
  assert.match(text, /Prahok Ktis/);
  assert.match(text, /trois recettes|3 recettes/);
  assert.match(buildShoppingListText([], 2), /deux recettes|2 recettes/);
});
