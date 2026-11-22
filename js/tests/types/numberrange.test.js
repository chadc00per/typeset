// numberrange: Ordered inclusive exact decimal endpoints, canonical LOW-HIGH.
import { test } from 'node:test';
import { NumberRange } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('numberrange: ordered exact decimals, canonical LOW-HIGH', () => {
  accepts(NumberRange, [['1-4', '1-4'], ['1.50 - 2.0', '1.5-2'], ['-2 - -1', '-2--1'], ['-0-0', '0-0']]);
  refuses(NumberRange, ['4-1', '1', '1e3-2', 'a-b']);
});
