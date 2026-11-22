// ratio: Exact nonnegative ratio, reduced to integer numerator:denominator.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Ratio } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('ratio: exact, reduced', () => {
  accepts(Ratio, [['1920:1080', '16:9'], ['1.5:1', '3:2'], ['0:5', '0:1'], ['4 / 3', '4:3']]);
  refuses(Ratio, ['5:0', '-1:2', '1:2:3', '1e3:1']);
});

test('ratio: validate() takes only the reduced ratio', () => {
  Ratio.validate('16:9');
  assert.throws(() => Ratio.validate('32:18'), /canonical value required/);
});
