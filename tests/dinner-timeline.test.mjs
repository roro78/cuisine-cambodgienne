import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SERVICE_TIMES,
  PLANNING_MARGIN_MINUTES,
  readRecipeDuration,
  displayClock,
  buildPilotServicePlan
} from '../src/utils/dinnerTimeline.mjs';

const main = { title: 'Amok Trey', prepTime: '30 min', cookTime: '25 min' };
const dessert = { title: 'Chek Ktis', prepTime: '10 min', cookTime: '15 min' };

test('offers only explicitly supported service-time choices', () => {
  assert.deepEqual(SERVICE_TIMES, ['19:00', '19:30', '20:00', '20:30', '21:00']);
  assert.equal(PLANNING_MARGIN_MINUTES, 15);
});

test('calculates clear prep / margin / cook / serve milestones at 20h', () => {
  const result = buildPilotServicePlan(main, dessert, '20:00');
  assert.deepEqual(result.steps.map((step) => step.time), ['18h50', '19h20', '19h35', '20h00']);
  assert.deepEqual(result.steps.map((step) => step.id), ['prep', 'margin', 'cook', 'serve']);
});

test('recomputes the timeline for other supported service times', () => {
  const result = buildPilotServicePlan(main, dessert, '19:30');
  assert.equal(result.steps[0].time, '18h20');
  assert.equal(result.steps[3].time, '19h30');
});

test('keeps dessert timing separate from the main service plan', () => {
  const result = buildPilotServicePlan(main, dessert, '20:00');
  assert.equal(result.dessertPrepMinutes, 10);
  assert.equal(result.dessertCookMinutes, 15);
  assert.equal(result.steps.length, 4);
});

test('handles minute wrapping across midnight without invalid clock values', () => {
  assert.equal(displayClock(-15), '23h45');
  assert.equal(displayClock(1440), '00h00');
  assert.equal(displayClock(60), '01h00');
});

test('rejects malformed and misleading duration metadata', () => {
  assert.equal(readRecipeDuration('25 min'), 25);
  for (const value of ['25-30 min', 'vingt minutes', '2 h', '-20 min', '1000 min', '', undefined]) {
    assert.throws(() => readRecipeDuration(value), RangeError);
  }
});

test('rejects unexpected service times and out-of-range buffers', () => {
  for (const time of ['18:00', '19:15', '24:00', 'bad', 123]) {
    assert.throws(() => buildPilotServicePlan(main, dessert, time), RangeError);
  }
  for (const buffer of [-1, 2.3, 61, Number.NaN]) {
    assert.throws(() => buildPilotServicePlan(main, dessert, '20:00', buffer), RangeError);
  }
});

test('preparation and cooking durations are not treated as a guaranteed real-world schedule', () => {
  const result = buildPilotServicePlan(main, dessert, '21:00');
  assert.match(result.steps[1].description, /conseil de planification/);
  assert.match(result.steps[3].description, /varient selon le matériel/);
});
