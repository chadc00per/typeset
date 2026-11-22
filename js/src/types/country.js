// country: a registered CLDR country or territory code, uppercase.
import { contains } from '../lib/cldr.js';
import { fail } from '../lib/errors.js';
import { asciiUpper, text } from '../lib/text.js';

export const definition = {
  name: 'country',
  description: 'Registered CLDR country or territory code, uppercase',
  example: 'US'
};

export function normalize(value, path, type) {
  const code = asciiUpper(text(value, path, type));
  return /^[A-Z]{2}$/.test(code) && contains('country', code) ? code : fail(path, type);
}
