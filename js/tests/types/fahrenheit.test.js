// fahrenheit: Fahrenheit temperature string, explicit °F, at or above absolute zero.
import { test } from 'node:test';
import { Fahrenheit } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('fahrenheit: explicit °F, at or above absolute zero', () => {
  accepts(Fahrenheit, [['-459.67F', '-459.67°F'], ['125.6°F', '125.6°F']]);
  refuses(Fahrenheit, ['-459.68°F']);
});
