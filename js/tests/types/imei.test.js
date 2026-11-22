// imei: Checksum-validated 15-digit IMEI.
import { test } from 'node:test';
import { Imei } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('imei: 15 digits, Luhn', () => {
  accepts(Imei, [['49-015420-323751-8', '490154203237518'], ['490154203237518', '490154203237518']]);
  refuses(Imei, ['490154203237519', '49015420323751', '4901542032375180', '49015420323751X']);
});
