// multiplier: Nonnegative finite multiplier.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Multiplier } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('multiplier: nonnegative, x and × accepted', () => {
  accepts(Multiplier, [['2x', 2], ['1.5×', 1.5]]);
  refuses(Multiplier, ['-2x']);
});

test('multiplier: 360 stays 360; only angle wraps at a full turn', () => {
  assert.equal(Multiplier.normalize(360), 360);
  assert.equal(Multiplier.normalize('360'), 360);
});
