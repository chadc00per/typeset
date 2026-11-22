// Durations shared by interval and expiry: calendar months plus exact
// milliseconds, read from "24h", "1w", "P1Y2M" or a number of milliseconds.
import { fail } from './errors.js';
import { text } from './text.js';

const UNIT_MS = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
// The text forms a duration takes, for telling one from a timestamp.
export const DURATION_TEXT = /^(?:P|\d+(?:\.\d+)?\s*(?:ms|s|m|h|d|w)$)/i;

// Exact nonnegative milliseconds; fractions finer than a millisecond are rejected.
function millis(raw, factor, path, type) {
  const [whole, fraction = ''] = raw.split('.');
  const denominator = 10n ** BigInt(fraction.length);
  const scaled = BigInt(whole + fraction) * BigInt(factor);
  if (scaled % denominator) return fail(path, type, 'millisecond precision');
  return scaled / denominator;
}
export function duration(value, path, type) {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) return fail(path, type, 'nonnegative whole milliseconds');
    return { months: 0, ms: BigInt(value) };
  }
  const raw = text(value, path, type, { max: 256 });
  let months = 0n, ms;
  const short = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)$/i.exec(raw);
  // "1M" reads as a month to anyone who knows ISO 8601 (P1M), so the short form takes only a lowercase m.
  if (short?.[2] === 'M') return fail(path, type, 'm is minutes; write P1M for a month');
  if (short) ms = millis(short[1], UNIT_MS[short[2].toLowerCase()], path, type);
  else {
    const week = /^P(\d+)W$/i.exec(raw);
    if (week) ms = BigInt(week[1]) * 604800000n;
    else {
      const match = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i.exec(raw);
      if (!match || !match.slice(1).some(v => v !== undefined) || /T$/i.test(raw)) return fail(path, type, 'duration such as 24h, 1w, or P1Y2M');
      months = BigInt(match[1] || 0) * 12n + BigInt(match[2] || 0);
      ms = BigInt(match[3] || 0) * 86400000n + BigInt(match[4] || 0) * 3600000n + BigInt(match[5] || 0) * 60000n + millis(match[6] || '0', 1000, path, type);
    }
  }
  if (ms > MAX_SAFE || months > 119987n) return fail(path, type, 'duration out of range');
  return { months: Number(months), ms };
}
