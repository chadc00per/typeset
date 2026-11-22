// isoweek: an ISO 8601 week YYYY-Www; week 53 only in years that have one.
import { isLeap, pad } from '../lib/calendar.js';
import { fail } from '../lib/errors.js';
import { text } from '../lib/text.js';

export const definition = {
  name: 'isoweek',
  description: 'ISO 8601 week YYYY-Www',
  example: '2026-W20',
  constraints: 'value',
  control: 'week',
  className: 'IsoWeek'
};

// An ISO year has 53 weeks when it starts on a Thursday, or on a Wednesday in a leap year.
function isoWeeks(y) {
  const date = new Date(0);
  date.setUTCFullYear(y, 0, 1); // setUTCFullYear, unlike Date.UTC, keeps years below 100
  const jan1 = date.getUTCDay(); // 0 = Sunday
  return jan1 === 4 || (jan1 === 3 && isLeap(y)) ? 53 : 52;
}

export function normalize(value, path, type) {
  const m = /^(\d{4})-?W(\d{1,2})$/i.exec(text(value, path, type, { max: 256 }));
  if (!m || m[1] === '0000') return fail(path, type, 'YYYY-Www');
  const week = Number(m[2]);
  if (week < 1 || week > isoWeeks(Number(m[1]))) return fail(path, type, `week 01..${isoWeeks(Number(m[1]))}`);
  return `${m[1]}-W${pad(week)}`;
}
