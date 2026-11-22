// upc: a 12-digit UPC-A with a valid checksum, leading zeros kept (not compressed UPC-E).
import { digitGroups, validGS1 } from '../lib/checksum.js';
import { fail } from '../lib/errors.js';

export const definition = {
  name: 'upc',
  description: 'Checksum-validated 12-digit UPC-A, leading zeros preserved',
  example: '012345678905'
};

export function normalize(value, path, type) {
  const digits = digitGroups(value, path, type);
  return /^\d{12}$/.test(digits) && validGS1(digits) ? digits : fail(path, type);
}
