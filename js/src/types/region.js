// region: a registered CLDR subdivision code with its country, uppercase (US-NY).
import { contains } from '../lib/cldr.js';
import { fail } from '../lib/errors.js';
import { asciiUpper, text } from '../lib/text.js';

export const definition = {
  name: 'region',
  description: 'Registered subdivision code, uppercase and country-qualified',
  example: 'US-NY'
};

export function normalize(value, path, type) {
  const code = asciiUpper(text(value, path, type));
  return /^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(code) && contains('subdivision', code.replace('-', '').toLowerCase()) ? code : fail(path, type);
}
