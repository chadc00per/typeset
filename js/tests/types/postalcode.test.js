// postalcode: Postal code, uppercase without spaces or hyphens (structural validation).
import { test } from 'node:test';
import { PostalCode } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('postal codes: uppercase without separators', () => {
  accepts(PostalCode, [['sw1a 1aa', 'SW1A1AA'], ['10001-1234', '100011234']]);
  refuses(PostalCode, ['a--b', '', 'a_b', 'x'.repeat(33)]);
});
