// integer: Safe signed whole number.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Integer } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('integer: whole decimal digits within the safe range', () => {
  accepts(Integer, [['42', 42], ['-7.00', -7], [9007199254740991, 9007199254740991], [-0, 0]]);
  refuses(Integer, ['1.5', 1.5, '9007199254740993', '1e3', 'x', NaN]);
});

test('integer: validate() takes only a stored number', () => {
  Integer.validate(42);
  assert.throws(() => Integer.validate('42'), /normalize input before validation/);
});

test('integer: 360 stays 360; only angle wraps at a full turn', () => {
  assert.equal(Integer.normalize(360), 360);
  assert.equal(Integer.normalize('360'), 360);
});
