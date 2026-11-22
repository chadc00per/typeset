// expiry: a UTC timestamp. A duration ("30d", "P1M") resolves once, when
// normalized, against `now` (default: the clock); calendar months are added in
// UTC and clamped to the target month's last day. validate() takes only
// canonical stored values, so a stored relative expiry is refused rather than
// resolved against a new clock.
import { DURATION_TEXT, duration } from '../lib/duration.js';
import { instant } from '../lib/instant.js';

export const definition = {
  name: 'expiry',
  description: 'UTC ISO timestamp; relative durations resolve at normalization time',
  example: '2026-12-31T23:59:59Z',
  constraints: 'value'
};

export function normalize(value, path, type, now) {
  if (typeof value === 'string' && DURATION_TEXT.test(value.trim())) {
    const { months, ms } = duration(value, path, type);
    const date = new Date(now ?? Date.now());
    if (months) {
      const dayOfMonth = date.getUTCDate(); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + months);
      const end = new Date(date.getTime()); end.setUTCMonth(end.getUTCMonth() + 1); end.setUTCDate(0);
      date.setUTCDate(Math.min(dayOfMonth, end.getUTCDate()));
    }
    return instant(date.getTime() + Number(ms), path, type);
  }
  return instant(value, path, type);
}
