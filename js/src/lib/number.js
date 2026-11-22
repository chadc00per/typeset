// Bounded numbers shared by integer, int32, smallint, uint8, uint16, uint32,
// percentage, fraction, angle, probability, multiplier and ttl: a number, or
// its text spelling with the type's unit ("25%", "1/4", "450deg", "2x").
import { fail } from './errors.js';
import { DECIMAL, text } from './text.js';

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

// `whole`: digits only, within Number's safe range. `min`/`max`: inclusive
// bounds. `unit`: a suffix the text form may end with. `ratio`: text may be a
// fraction a/b. `wrap`: a period the value is reduced into [0, wrap).
export function number(value, path, type, { whole = false, min, max, unit, ratio = false, wrap } = {}) {
  if (typeof value === 'string') {
    let raw = text(value, path, type, { max: 256 });
    if (whole) {
      if (!/^[+-]?\d+(?:\.0+)?$/.test(raw)) return fail(path, type, 'whole decimal digits');
      const exact = BigInt(raw.replace(/\.0+$/, ''));
      if (exact < -MAX_SAFE || exact > MAX_SAFE) return fail(path, type, 'safe whole number');
    }
    if (unit) raw = raw.replace(unit, '');
    if (ratio && /^\d+\s*\/\s*\d+$/.test(raw)) {
      const [a, b] = raw.split('/').map(Number);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return fail(path, type);
      value = a / b;
    } else {
      if (!DECIMAL.test(raw)) return fail(path, type);
      value = Number(raw);
    }
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) return fail(path, type, 'finite number');
  if (whole && !Number.isSafeInteger(value)) return fail(path, type, 'safe whole number');
  if ((min !== undefined && value < min) || (max !== undefined && value > max)) return fail(path, type, max === undefined ? 'nonnegative' : `${min}..${max}`, 'range');
  if (wrap) {
    value %= wrap; // reduce first, so a small positive value isn't lost to adding a period
    if (value < 0) value += wrap;
    if (value === wrap) value = 0; // a tiny negative value plus the period rounds up to it
  }
  return Object.is(value, -0) ? 0 : value;
}
