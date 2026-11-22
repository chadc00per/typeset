// uint16: Unsigned 16-bit integer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UInt16 } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('uint16: 0 through 65535', () => {
  accepts(UInt16, [['65535', 65535]]);
  refuses(UInt16, [65536, -1]);
});

test('uint16: 360 stays 360; only angle wraps at a full turn', () => {
  assert.equal(UInt16.normalize(360), 360);
  assert.equal(UInt16.normalize('360'), 360);
});
