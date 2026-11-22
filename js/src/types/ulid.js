// ulid: 26 Crockford base32 characters, uppercase. Crockford's look-alikes read
// as digits (I and L as 1, O as 0); the first character is at most 7, so it fits 128 bits.
import { fail } from '../lib/errors.js';
import { asciiUpper, text } from '../lib/text.js';

export const definition = {
  name: 'ulid',
  description: 'ULID, 26 uppercase Crockford base32 characters',
  example: '01ARZ3NDEKTSV4RRFFQ69G5FAV'
};

export function normalize(value, path, type) {
  const raw = asciiUpper(text(value, path, type, { max: 64 })).replace(/[IL]/g, '1').replaceAll('O', '0');
  return /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/.test(raw) ? raw : fail(path, type);
}
