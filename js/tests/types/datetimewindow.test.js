// datetimewindow: Ordered inclusive pair of UTC ISO timestamps.
import { test } from 'node:test';
import { DateTimeWindow } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('datetimewindow: an ordered pair of UTC instants', () => {
  accepts(DateTimeWindow, [[['2026-01-01T00:00:00+01:00', '2026-01-01T00:00:00Z'], ['2025-12-31T23:00:00.000Z', '2026-01-01T00:00:00.000Z']]]);
  accepts(DateTimeWindow, [[[0, '2026-01-01T00:00:00Z'], ['1970-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']]]);
  refuses(DateTimeWindow, [['2026-12-31T00:00:00Z', '2026-01-01T00:00:00Z'], ['2026-01-01'], ['2026-01-01', '2026-01-02']]);
});
