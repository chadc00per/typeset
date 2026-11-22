// int32: Signed 32-bit integer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Int32 } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('int32: the signed 32-bit range', () => {
  accepts(Int32, [['2147483647', 2147483647]]);
  refuses(Int32, ['2147483648']);
});

test('int32: 360 stays 360; only angle wraps at a full turn', () => {
  assert.equal(Int32.normalize(360), 360);
  assert.equal(Int32.normalize('360'), 360);
});
