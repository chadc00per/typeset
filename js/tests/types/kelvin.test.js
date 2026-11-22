// kelvin: Kelvin temperature string, explicit K, at or above absolute zero.
import { test } from 'node:test';
import { Kelvin } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('kelvin: explicit K, at or above absolute zero', () => {
  accepts(Kelvin, [['300 k', '300K'], ['273.150K', '273.15K']]);
  refuses(Kelvin, ['300°K', '-1K', '-0.01K', '300', '300°C', '300 F']);
});
