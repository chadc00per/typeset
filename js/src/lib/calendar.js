// Calendar facts shared by the date types: weekday and month names, leap
// years, zero padding and calendar-day checking.
import { fail } from './errors.js';

export const WEEKDAYS = Object.freeze(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
export const MONTHS = Object.freeze(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']);

export const isLeap = y => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
export const pad = (n, width = 2) => String(n).padStart(width, '0');

// A YYYY-MM-DD string naming a real Gregorian day in years 0001..9999.
export function validDay(raw, path, type) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return fail(path, type, 'YYYY-MM-DD');
  const [y, m, d] = match.slice(1).map(Number);
  const days = [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > days[m - 1]) return fail(path, type, 'real calendar day, years 0001..9999');
  return raw;
}
