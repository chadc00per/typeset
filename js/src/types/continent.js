// continent: a continent's two-letter code (the seven-continent model GeoNames
// uses), from the code or the English name.
import { fail } from '../lib/errors.js';
import { asciiLower, asciiUpper, text } from '../lib/text.js';

export const definition = {
  name: 'continent',
  description: 'Continent code: AF, AN, AS, EU, NA, OC, SA',
  example: 'EU',
  options: Object.freeze(['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA'])
};

const NAMES = { africa: 'AF', antarctica: 'AN', asia: 'AS', europe: 'EU', 'north america': 'NA', oceania: 'OC', 'south america': 'SA' };

export function normalize(value, path, type) {
  const raw = asciiLower(text(value, path, type, { max: 64 })).replace(/[\s_-]+/g, ' ');
  const code = raw.length === 2 ? asciiUpper(raw) : NAMES[raw];
  return definition.options.includes(code) ? code : fail(path, type);
}
