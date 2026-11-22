// uint32: Unsigned 32-bit integer.
import { test } from 'node:test';
import { UInt32 } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('uint32: 0 through 4294967295', () => {
  accepts(UInt32, [[4294967295, 4294967295]]);
  refuses(UInt32, [4294967296, -1]);
});
