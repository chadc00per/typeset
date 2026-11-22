// timezone: IANA time zone, canonicalized by the Node ICU runtime.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TimeZone } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('timezone: IANA zones as the runtime canonicalizes them', () => {
  accepts(TimeZone, [['america/new_york', 'America/New_York'], ['UTC', 'UTC']]);
  refuses(TimeZone, ['EST', '+05:00', 'Mars/Base', '']);
});

test('timezone: validate() takes only the canonical zone name', () => {
  TimeZone.validate('America/New_York');
  assert.throws(() => TimeZone.validate('america/new_york'), /canonical value required/);
});

test('timezone: lookalikes that case mapping folds into ASCII are refused', () => {
  refuses(TimeZone, ['Asia/\u212aolkata']);
});
