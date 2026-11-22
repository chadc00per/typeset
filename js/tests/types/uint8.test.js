// uint8: Unsigned 8-bit integer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UInt8 } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('uint8: 0 through 255', () => {
  accepts(UInt8, [['255', 255], [0, 0], ['-0', 0]]);
  refuses(UInt8, [256, -1, '1.5', 'x', '0x10']);
  assert.throws(() => UInt8.validate('255'), /normalize input before validation/);
});
