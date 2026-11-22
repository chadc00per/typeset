// language: a registered two- or three-letter language code (CLDR), lowercase.
// A deprecated or three-letter alias is stored as its replacement ("iw" → "he",
// "eng" → "en"), from the pinned alias table (data/languages.json).
import { contains } from '../lib/cldr.js';
import { fail } from '../lib/errors.js';
import { asciiLower, text } from '../lib/text.js';
import data from '../../../data/languages.json' with { type: 'json' };

export const definition = {
  name: 'language',
  description: 'Registered language code, canonical lowercase',
  example: 'en'
};

export function normalize(value, path, type) {
  const raw = text(value, path, type);
  if (!/^[a-z]{2,3}$/i.test(raw)) return fail(path, type);
  const lower = asciiLower(raw);
  // An alias may name a script or region too ("sh" → "sr-Latn"); a language code keeps only the language.
  const code = Object.hasOwn(data.aliases, lower) ? data.aliases[lower].split('-')[0] : lower;
  return contains('language', code) ? code : fail(path, type);
}
