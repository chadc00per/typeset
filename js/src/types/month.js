// month: an English month name or its three-letter abbreviation, stored as the lowercase full name.
import { MONTHS } from '../lib/calendar.js';
import { fail } from '../lib/errors.js';
import { asciiLower, text } from '../lib/text.js';

export const definition = {
  name: 'month',
  description: 'English month name, lowercase',
  example: 'october',
  options: MONTHS
};

export function normalize(value, path, type) {
  const lower = asciiLower(text(value, path, type));
  return MONTHS.find(name => name === lower || name.slice(0, 3) === lower) || fail(path, type);
}
