// interval: Nonnegative ISO duration; calendar months preserved, numeric input is milliseconds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Interval } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('interval: canonical ISO 8601 duration, calendar months kept', () => {
  accepts(Interval, [['P1Y2M', 'P1Y2M'], ['24h', 'P1D'], ['1.5s', 'PT1.5S'], ['P1W', 'P7D'], [90000, 'PT1M30S'], ['0s', 'PT0S']]);
  refuses(Interval, ['PT', 'P', '1.0005s', '-1h', -1, '1y']);
});

test('interval: validate() takes only the ISO spelling', () => {
  assert.throws(() => Interval.validate(3600000), /normalize input before validation/);
});

test('interval: a short-form uppercase M is refused as ambiguous', () => {
  assert.throws(() => Interval.normalize('1M'), /m is minutes; write P1M for a month/);
  assert.equal(Interval.normalize('1m'), 'PT1M');
  assert.equal(Interval.normalize('P1M'), 'P1M');
  assert.equal(Interval.normalize('1MS'), 'PT0.001S');
});
