// upc: Checksum-validated 12-digit UPC-A, leading zeros preserved.
import { test } from 'node:test';
import { Upc } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('upc: GS1 checksum, 12 digits', () => {
  accepts(Upc, [['0 12345 67890 5', '012345678905']]);
  refuses(Upc, ['012345678900', '12345670']);
});
