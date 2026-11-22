// day: a Gregorian calendar day YYYY-MM-DD with no time zone, years 0001..9999.
import { validDay } from '../lib/calendar.js';
import { text } from '../lib/text.js';

export const definition = {
  name: 'day',
  description: 'Gregorian calendar day, no timezone',
  example: '2026-05-15',
  constraints: 'value',
  control: 'date'
};

export function normalize(value, path, type) {
  return validDay(text(value, path, type, { max: 256 }), path, type);
}
