// continent: Continent code: AF, AN, AS, EU, NA, OC, SA.
import { test } from 'node:test';
import { Continent } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('continent: code or English name', () => {
  accepts(Continent, [['north_america', 'NA'], ['eu', 'EU'], ['South America', 'SA'], ['AN', 'AN']]);
  refuses(Continent, ['Australia', 'XX', 'America', '']);
});
