// xyz: Three finite numbers [x, y, z].
import { test } from 'node:test';
import { XYZ } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('xyz: three finite numbers, unbounded', () => {
  accepts(XYZ, [[[1, 2, 3], [1, 2, 3]]]);
  refuses(XYZ, [[1, 2]]);
});
