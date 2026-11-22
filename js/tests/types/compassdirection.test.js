// compassdirection: Sixteen-point compass direction, uppercase.
import { test } from 'node:test';
import { CompassDirection } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('compass directions: sixteen points, uppercase', () => {
  accepts(CompassDirection, [['nw', 'NW'], ['\tSsE ', 'SSE']]);
  refuses(CompassDirection, ['north', 'NNNE', '']);
});

test('compassdirection: lookalikes that case mapping folds into ASCII are refused', () => {
  refuses(CompassDirection, ['\u00dfe', '\u017f']);
});
