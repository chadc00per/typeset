// barcode: any printable ASCII barcode payload, kept exactly: independent of
// symbology, not an image or a claim of GS1 allocation. Edge spaces can be
// meaningful and are preserved.
import { fail } from '../lib/errors.js';
import { text } from '../lib/text.js';

export const definition = {
  name: 'barcode',
  description: 'Opaque printable ASCII barcode payload, case and spaces preserved',
  example: '012345678905'
};

export function normalize(value, path, type) {
  text(value, path, type);
  return value.length <= 256 && /^[\x20-\x7e]+$/.test(value) ? value : fail(path, type);
}
