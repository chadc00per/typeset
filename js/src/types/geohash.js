// geohash: 1 to 12 characters of the geohash base32 alphabet, lowercase.
import { fail } from '../lib/errors.js';
import { asciiLower, text } from '../lib/text.js';

export const definition = {
  name: 'geohash',
  description: 'Geohash, 1–12 lowercase base32 characters',
  example: '9q8yyk'
};

export function normalize(value, path, type) {
  const raw = asciiLower(text(value, path, type, { max: 64 }));
  return /^[0-9b-hjkmnp-z]{1,12}$/.test(raw) ? raw : fail(path, type);
}
