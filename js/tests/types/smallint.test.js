// smallint: Signed 16-bit integer.
import { test } from 'node:test';
import { SmallInt } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('smallint: the signed 16-bit range', () => {
  accepts(SmallInt, [['-32768', -32768]]);
  refuses(SmallInt, ['32768']);
});
