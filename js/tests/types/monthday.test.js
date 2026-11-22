// monthday: Recurring month and day --MM-DD, no year.
import { test } from 'node:test';
import { MonthDay } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('monthday: --MM-DD, February 29 allowed', () => {
  accepts(MonthDay, [['5-15', '--05-15'], ['--02-29', '--02-29'], ['12-31', '--12-31']]);
  refuses(MonthDay, ['02-30', '04-31', '13-01', '00-10', '2026-05-15']);
});
