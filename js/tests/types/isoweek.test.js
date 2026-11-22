// isoweek: ISO 8601 week YYYY-Www.
import { test } from 'node:test';
import { IsoWeek } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('isoweek: 52 or 53 weeks by ISO year', () => {
  accepts(IsoWeek, [['2026w5', '2026-W05'], ['2026-W53', '2026-W53'], ['2020W53', '2020-W53'], ['0001-W01', '0001-W01']]);
  refuses(IsoWeek, ['2025-W53', '2026-W54', '2026-W00', '2026-05', '0000-W01']);
});
