// Temperatures shared by celsius, fahrenheit and kelvin: an exact decimal with
// its explicit unit, at or above absolute zero (checked in exact decimal arithmetic).
import { fail } from './errors.js';
import { EXACT_DECIMAL, exactDecimal, text } from './text.js';

const TEMPERATURE = new RegExp(`^(${EXACT_DECIMAL})[ \\t]*°?[ \\t]*([CFK])$`, 'i');

// `unit` is the stored suffix ('°C', '°F' or 'K'); `absoluteZero` is in hundredths of a degree.
export function temperature(value, path, type, { unit, absoluteZero }) {
  const m = TEMPERATURE.exec(text(value, path, type, { max: 128, control: null, empty: true }));
  // Kelvin is written without a degree sign.
  if (!m || m[2].toUpperCase() !== unit.at(-1) || (!unit.startsWith('°') && m[0].includes('°'))) return fail(path, type, `use ${unit}`);
  const degrees = exactDecimal(m[1]);
  const canonical = `${degrees.text}${unit}`;
  const scale = Math.max(degrees.scale, 2);
  const n = degrees.n * 10n ** BigInt(scale - degrees.scale);
  if (n < absoluteZero * 10n ** BigInt(scale - 2) || canonical.length > 128) return fail(path, type);
  return canonical;
}
