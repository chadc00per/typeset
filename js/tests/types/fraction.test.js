// fraction: Fraction of a whole, 0 through 1.
import { test } from 'node:test';
import { Fraction } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('fraction: 0 through 1, a/b accepted', () => {
  accepts(Fraction, [['1/4', 0.25], ['0.5', 0.5]]);
  refuses(Fraction, ['3/2', '1/0']);
});
