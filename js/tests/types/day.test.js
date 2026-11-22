// day: Gregorian calendar day, no timezone.
import { test } from 'node:test';
import { Day } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('day: a real Gregorian calendar day', () => {
  accepts(Day, [['2024-02-29', '2024-02-29'], [' 2026-05-15 ', '2026-05-15']]);
  refuses(Day, ['2026-02-29', '0000-01-01', '2026-13-01', '2026-5-15', '']);
});

test('day: validate() takes only a stored string', () => {
  Day.validate('2026-05-15');
});
