// cron: a five-field cron expression, month and weekday names read as numbers.
// Term and wildcard structure is kept: rewriting day fields to expanded sets can
// change cron's day-of-month/day-of-week interaction. A field's comma list is a
// set of terms, so each term is stored once and in order (* first, then by
// start, end and step): "15,1", "1,15" and "1,1,15" are one schedule, one spelling.
import { MONTHS, WEEKDAYS } from '../lib/calendar.js';
import { fail } from '../lib/errors.js';
import { asciiUpper, text } from '../lib/text.js';

export const definition = {
  name: 'cron',
  description: 'Five-field cron expression, numeric or abbreviated month/weekday names',
  example: '0 9 * * 1-5'
};

// cron's names: JAN..DEC, and SUN..SAT with Sunday as 0.
const CRON_MONTHS = MONTHS.map(name => name.slice(0, 3).toUpperCase());
const CRON_DAYS = [WEEKDAYS[6], ...WEEKDAYS.slice(0, 6)].map(name => name.slice(0, 3).toUpperCase());
const LIMITS = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];
const TERM = /^(\*|\d+)(?:-(\d+))?(?:\/(\d+))?$/;

// The order terms are stored in: * first, then by start, end and step.
function termKey(term) {
  const [, start, end, step] = TERM.exec(term);
  return start === '*' ? [-1, 0, Number(step ?? 1)] : [Number(start), Number(end ?? start), Number(step ?? 1)];
}
function byTerm(a, b) {
  const x = termKey(a), y = termKey(b);
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

export function normalize(value, path, type) {
  const fields = asciiUpper(text(value, path, type, { max: 512, control: /[\r\n]/, empty: true })).split(/[ \t]+/);
  if (fields.length !== 5) return fail(path, type, 'five fields, no command');
  return fields.map((field, index) => {
    const [min, max] = LIMITS[index];
    const endpoint = part => {
      const name = index === 3 ? CRON_MONTHS.indexOf(part) + 1 : index === 4 ? CRON_DAYS.indexOf(part) : -1;
      const n = /^\d+$/.test(part) ? Number(part) : name;
      if (!Number.isInteger(n) || n < min || n > max) return fail(path, type);
      return n;
    };
    const terms = field.split(',').map(term => {
      const pieces = term.split('/');
      if (pieces.length > 2 || !pieces[0]) return fail(path, type);
      let base;
      if (pieces[0] === '*') base = '*';
      else {
        const pair = pieces[0].split('-');
        if (pair.length > 2 || pair.some(p => !p)) return fail(path, type);
        const nums = pair.map(endpoint);
        if (nums.length === 2 && nums[0] > nums[1]) return fail(path, type);
        // Sunday is 0 or 7 in the weekday field; a lone 7 is stored as 0 so one
        // schedule has one spelling (a range such as 5-7 keeps its 7).
        if (index === 4 && nums.length === 1 && nums[0] === 7) nums[0] = 0;
        base = nums.join('-');
      }
      if (pieces.length === 1) return base;
      if ((base !== '*' && !base.includes('-')) || !/^\d+$/.test(pieces[1])) return fail(path, type);
      const step = Number(pieces[1]);
      if (!Number.isInteger(step) || step < 1 || step > max - min + 1) return fail(path, type);
      return `${base}/${step}`;
    });
    return [...new Set(terms)].sort(byTerm).join(',');
  }).join(' ');
}
