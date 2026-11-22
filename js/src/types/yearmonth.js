// yearmonth: a Gregorian year and month YYYY-MM with no time zone.
import { pad } from '../lib/calendar.js';
import { fail } from '../lib/errors.js';
import { text } from '../lib/text.js';

export const definition = {
  name: 'yearmonth',
  description: 'Gregorian year and month YYYY-MM, no timezone',
  example: '2026-05',
  constraints: 'value',
  control: 'month',
  className: 'YearMonth'
};

export function normalize(value, path, type) {
  const m = /^(\d{4})[-/](\d{1,2})$/.exec(text(value, path, type, { max: 256 }));
  if (!m || m[1] === '0000' || Number(m[2]) < 1 || Number(m[2]) > 12) return fail(path, type, 'YYYY-MM');
  return `${m[1]}-${pad(Number(m[2]))}`;
}
