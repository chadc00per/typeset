// year: a Gregorian year as four digits YYYY, 0001..9999, from text or a number.
import { pad } from '../lib/calendar.js';
import { fail } from '../lib/errors.js';
import { text } from '../lib/text.js';

export const definition = {
  name: 'year',
  description: 'Gregorian year YYYY, 0001..9999',
  example: '2026',
  constraints: 'value'
};

export function normalize(value, path, type) {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value < 1 || value > 9999) return fail(path, type, '0001..9999');
    return pad(value, 4);
  }
  const raw = text(value, path, type, { max: 256 });
  return /^\d{4}$/.test(raw) && raw !== '0000' ? raw : fail(path, type, 'YYYY, 0001..9999');
}
