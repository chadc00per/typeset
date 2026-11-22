// time: Local wall-clock time, millisecond precision, no timezone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Time } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('time: wall-clock, millisecond precision', () => {
  accepts(Time, [['14:30', '14:30:00.000'], ['14:30:00.5', '14:30:00.500']]);
  refuses(Time, ['24:00', '14:60', '14:30Z', '2pm']);
});

test('time: validate() takes only the full HH:mm:ss.SSS', () => {
  assert.throws(() => Time.validate('14:30'), /canonical value required/);
});
