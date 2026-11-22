// fiscalperiod: Fiscal year/quarter label or calendar month; no calendar inference.
import { test } from 'node:test';
import { FiscalPeriod } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('fiscalperiod: FY label, quarter or calendar month', () => {
  accepts(FiscalPeriod, [['fy2026-q2', 'FY2026-Q2'], ['FY2026', 'FY2026'], ['2026-1', '2026-01']]);
  refuses(FiscalPeriod, ['FY0000', '2026-13', 'FY2026-Q5', 'Q2']);
});
