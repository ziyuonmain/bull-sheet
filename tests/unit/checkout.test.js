import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CHECKOUT_TABLE, getCheckoutSuggestion } from '../../js/components/checkout.js';

describe('Checkout Guide & Bogey Calculations', () => {
  test('covers all valid checkouts from 170 down to 2', () => {
    assert.deepEqual(CHECKOUT_TABLE[170], ['T20', 'T20', 'Bull']);
    assert.deepEqual(CHECKOUT_TABLE[40], ['D20']);
    assert.deepEqual(CHECKOUT_TABLE[32], ['D16']);
    assert.deepEqual(CHECKOUT_TABLE[2], ['D1']);

    // Check every key in CHECKOUT_TABLE has a valid double finish at the end
    for (const [scoreStr, route] of Object.entries(CHECKOUT_TABLE)) {
      const score = Number(scoreStr);
      assert.ok(score >= 2 && score <= 170);
      assert.ok(Array.isArray(route) && route.length <= 3);
      const lastDart = route[route.length - 1];
      assert.ok(lastDart.startsWith('D') || lastDart === 'Bull', `Score ${score} last dart should be a double or Bull`);
    }
  });

  test('identifies PDC bogey numbers where 3-dart checkout is impossible', () => {
    const bogeys = [169, 168, 166, 165, 163, 162, 159];
    bogeys.forEach(bogey => {
      const suggestion = getCheckoutSuggestion(bogey, 3, 'double');
      assert.ok(suggestion[0].toLowerCase().includes('bogey'), `Score ${bogey} should be detected as a bogey number`);
    });
  });

  test('suggests setup advice when score > 170', () => {
    const suggestion = getCheckoutSuggestion(181, 3, 'double');
    assert.ok(suggestion[0].includes('Aim T20'));
  });

  test('detects when checkout requires more darts than remaining in visit', () => {
    // 170 requires 3 darts; with 2 darts left, it should indicate insufficient darts
    const suggestion = getCheckoutSuggestion(170, 2, 'double');
    assert.ok(suggestion[0].includes('Requires 3 darts'));
  });
});
