// expiry: UTC ISO timestamp; relative durations resolve at normalization time.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Expiry } from '../../src/index.js';
import { normalize } from '../../src/types/expiry.js';

// Expiry resolved against a fixed clock instead of Date.now().
const expiryAt = (value, now) => normalize(value, 'v', 'expiry', now);

test('expiry resolves once against a clock and clamps calendar months in UTC', () => {
  const now = Date.parse('2024-01-31T12:34:56Z');
  assert.equal(expiryAt('30d', now), '2024-03-01T12:34:56.000Z');
  assert.equal(expiryAt('P1M', now), '2024-02-29T12:34:56.000Z');
  assert.equal(expiryAt('P1Y', Date.parse('2024-02-29T00:00:00Z')), '2025-02-28T00:00:00.000Z');
  const value = expiryAt('1h', now);
  assert.equal(expiryAt(value, now + 86400000), value);
  Expiry.validate(value);
  assert.throws(() => Expiry.validate('30d'), /expiry/);
});

test('expiry: a short-form uppercase M is refused as ambiguous', () => {
  assert.throws(() => Expiry.normalize('1M'), /m is minutes/);
});
