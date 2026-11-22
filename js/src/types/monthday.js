// monthday: a day of the year that recurs (a birthday, a holiday), as ISO
// 8601's --MM-DD with no year. February 29 is allowed.
import { pad } from '../lib/calendar.js';
import { fail } from '../lib/errors.js';
import { text } from '../lib/text.js';

export const definition = {
  name: 'monthday',
  description: 'Recurring month and day --MM-DD, no year',
  example: '--05-15',
  constraints: 'value',
  className: 'MonthDay'
};

const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function normalize(value, path, type) {
  const m = /^(?:--)?(\d{1,2})-(\d{1,2})$/.exec(text(value, path, type, { max: 256 }));
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12 || Number(m[2]) < 1 || Number(m[2]) > DAYS[Number(m[1]) - 1]) return fail(path, type, '--MM-DD');
  return `--${pad(Number(m[1]))}-${pad(Number(m[2]))}`;
}
