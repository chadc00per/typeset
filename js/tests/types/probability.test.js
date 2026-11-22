// probability: Probability, 0 through 1.
import { test } from 'node:test';
import { Probability } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('probability: 0 through 1', () => {
  accepts(Probability, [['0.75', 0.75]]);
  refuses(Probability, ['1.5']);
});
