// country: Registered CLDR country or territory code, uppercase.
import { test } from 'node:test';
import { Country } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('country: a registered CLDR code, uppercase', () => {
  accepts(Country, [['us', 'US'], [' gb ', 'GB']]);
  refuses(Country, ['XX', 'USA', 'EU', '']);
});

test('country: lookalikes that case mapping folds into ASCII are refused', () => {
  refuses(Country, ['u\u017f', '\u0131t']);
});
