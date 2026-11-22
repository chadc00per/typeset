// gtin: Checksum-validated GTIN-8/12/13/14, stored as 14 digits.
import { test } from 'node:test';
import { Gtin } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('gtin: GS1 checksum, padded to 14 digits', () => {
  accepts(Gtin, [['12345670', '00000012345670'], ['012345678905', '00012345678905'], ['00012345600012', '00012345600012']]);
  refuses(Gtin, ['12345671', '123456789']);
});
