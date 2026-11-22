// asin: an Amazon Standard Identification Number: a valid ISBN-10 (books), or B
// and nine letters or digits; uppercase.
import { validIsbn10 } from '../lib/checksum.js';
import { fail } from '../lib/errors.js';
import { asciiUpper, text } from '../lib/text.js';

export const definition = {
  name: 'asin',
  description: 'Amazon ASIN: a valid ISBN-10 or B and nine letters or digits',
  example: 'B07XJWD3KY'
};

export function normalize(value, path, type) {
  const raw = asciiUpper(text(value, path, type, { max: 64 }));
  return /^B[0-9A-Z]{9}$/.test(raw) || validIsbn10(raw) ? raw : fail(path, type);
}
