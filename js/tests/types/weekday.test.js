// weekday: English weekday name, lowercase.
import { test } from 'node:test';
import { Weekday } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('weekday: full English name or three-letter abbreviation', () => {
  accepts(Weekday, [['Mon', 'monday'], ['SUNDAY', 'sunday']]);
  refuses(Weekday, ['mo', 'lundi', '']);
});
