// month: English month name, lowercase.
import { test } from 'node:test';
import { Month } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('month: full English name or three-letter abbreviation', () => {
  accepts(Month, [['oct', 'october'], ['May', 'may']]);
  refuses(Month, ['octo', '13']);
});
