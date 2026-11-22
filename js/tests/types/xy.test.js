// xy: Two finite numbers [x, y].
import { test } from 'node:test';
import { XY } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('xy: two finite numbers, unbounded', () => {
  accepts(XY, [[[500, 500], [500, 500]], [['1e3', 2], [1000, 2]]]);
  refuses(XY, [[1, 2, 3], [Infinity, 0]]);
});
