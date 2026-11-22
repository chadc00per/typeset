// isbn: an ISBN-10 or ISBN-13 with a valid checksum, stored as ISBN-13. 979-0
// is reserved for ISMN rather than ISBN. This checks structure and checksum, not
// whether a registration group or publication was allocated.
import { checkDigit, digitGroups, validGS1, validIsbn10 } from '../lib/checksum.js';
import { fail } from '../lib/errors.js';

export const definition = {
  name: 'isbn',
  description: 'Checksum-validated ISBN-10 or ISBN-13, stored as ISBN-13',
  example: '9780131103627'
};

export function normalize(value, path, type) {
  let digits = digitGroups(value, path, type);
  if (/^\d{9}[\dX]$/.test(digits)) {
    if (!validIsbn10(digits)) return fail(path, type);
    const body = '978' + digits.slice(0, 9);
    digits = body + checkDigit(body);
  }
  return /^(978\d{10}|979[1-9]\d{9})$/.test(digits) && validGS1(digits) ? digits : fail(path, type);
}
