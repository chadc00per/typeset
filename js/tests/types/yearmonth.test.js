// yearmonth: Gregorian year and month YYYY-MM, no timezone.
import { test } from 'node:test';
import { YearMonth } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('yearmonth: YYYY-MM, 0001..9999', () => {
  accepts(YearMonth, [['2026-5', '2026-05'], ['2026/12', '2026-12']]);
  refuses(YearMonth, ['2026-13', '2026-00', '0000-01', '202605', '2026-05-01']);
});
