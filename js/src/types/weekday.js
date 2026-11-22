// weekday: an English weekday name or its three-letter abbreviation, stored as the lowercase full name.
import { WEEKDAYS } from '../lib/calendar.js';
import { fail } from '../lib/errors.js';
import { asciiLower, text } from '../lib/text.js';

export const definition = {
  name: 'weekday',
  description: 'English weekday name, lowercase',
  example: 'monday',
  options: WEEKDAYS
};

export function normalize(value, path, type) {
  const lower = asciiLower(text(value, path, type));
  return WEEKDAYS.find(name => name === lower || name.slice(0, 3) === lower) || fail(path, type);
}
