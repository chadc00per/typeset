// gtin: a GTIN-8, -12, -13 or -14 with a valid checksum, stored as 14 digits.
import { digitGroups, validGS1 } from '../lib/checksum.js';
import { fail } from '../lib/errors.js';

export const definition = {
  name: 'gtin',
  description: 'Checksum-validated GTIN-8/12/13/14, stored as 14 digits',
  example: '00012345600012'
};

export function normalize(value, path, type) {
  const digits = digitGroups(value, path, type);
  return /^\d+$/.test(digits) && validGS1(digits) && [8, 12, 13, 14].includes(digits.length) ? digits.padStart(14, '0') : fail(path, type);
}
