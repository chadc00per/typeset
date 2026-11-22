// interval: a nonnegative duration as canonical ISO 8601 (P1Y2M, PT1M30S).
// Calendar months are kept; days and smaller units are exact milliseconds, so
// "24h" is P1D. A number is milliseconds.
import { duration } from '../lib/duration.js';

export const definition = {
  name: 'interval',
  description: 'Nonnegative ISO duration; calendar months preserved, numeric input is milliseconds',
  example: 'P1Y2M'
};

export function normalize(value, path, type) {
  const { months, ms: total } = duration(value, path, type);
  let ms = total;
  const y = Math.floor(months / 12), m = months % 12;
  const d = ms / 86400000n; ms %= 86400000n;
  const h = ms / 3600000n; ms %= 3600000n;
  const min = ms / 60000n; ms %= 60000n;
  const seconds = ms ? `${ms / 1000n}${ms % 1000n ? '.' + String(ms % 1000n).padStart(3, '0').replace(/0+$/, '') : ''}S` : '';
  const date = `${y ? y + 'Y' : ''}${m ? m + 'M' : ''}${d ? d + 'D' : ''}`;
  const clock = `${h ? h + 'H' : ''}${min ? min + 'M' : ''}${seconds}`;
  return date || clock ? `P${date}${clock ? 'T' + clock : ''}` : 'PT0S';
}
