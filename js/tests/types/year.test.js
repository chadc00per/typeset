// year: Gregorian year YYYY, 0001..9999.
import { test } from 'node:test';
import { Year } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('year: four digits, 0001..9999', () => {
  accepts(Year, [['2026', '2026'], [2026, '2026'], [7, '0007'], ['0001', '0001']]);
  refuses(Year, ['0000', '26', '20260', 0, 10000, 2026.5, '2026-01']);
});
