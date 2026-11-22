// percentage: Percentage points, 0 through 100.
import { test } from 'node:test';
import { Percentage } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('percentage: 0 through 100, % accepted', () => {
  accepts(Percentage, [['25%', 25], [12.5, 12.5]]);
  refuses(Percentage, ['101%', -1]);
});
