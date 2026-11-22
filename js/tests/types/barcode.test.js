// barcode: Opaque printable ASCII barcode payload, case and spaces preserved.
import { test } from 'node:test';
import { Barcode } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('barcode: printable ASCII payload, kept exactly', () => {
  accepts(Barcode, [[' ABC-123 ', ' ABC-123 ']]);
  refuses(Barcode, ['', '   ', 'ünï', 'x'.repeat(257)]);
});
