// decimal: Exact decimal number kept as text, no floating-point rounding.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Decimal } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('decimal: exact text, exponents expanded, no rounding', () => {
  accepts(Decimal, [
    ['1.50', '1.5'], ['-1e-3', '-0.001'], ['.5', '0.5'], ['-0.0', '0'], ['+007', '7'],
    [1e21, '1000000000000000000000'], [0.1, '0.1'],
    ['0.10000000000000000000000001', '0.10000000000000000000000001']
  ]);
  assert.equal(Decimal.normalize(12345678901234567890n), '12345678901234567890');
  refuses(Decimal, ['1e', 'e3', '.', '1,000', 'NaN', Infinity, '1.2.3', '1e9999']);
});
