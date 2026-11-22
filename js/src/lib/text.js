// Shared input handling: the checks a string-taking type starts with and the
// decimal grammars several types read.
import { fail } from './errors.js';

// The longest input a type reads; individual types cap lower.
export const MAX_INPUT = 8192;

// The control characters a type refuses, by how much whitespace its grammar allows.
export const CONTROL = /[\x00-\x1f\x7f]/; // single-line, no tabs
export const CONTROL_EXCEPT_TAB = /[\x00-\x08\x0a-\x1f\x7f]/; // tab is whitespace in the grammar (HTTP parameters, cue timings)
export const CONTROL_EXCEPT_WHITESPACE = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/; // tab, LF and CR too (wrapped base64, pasted CSS)

// Case mapping for ASCII grammars: only A-Z and a-z change. toUpperCase() and
// toLowerCase() fold lookalikes into ASCII ('ſ' → 'S', 'ı' → 'I', 'ﬀ' → 'FF',
// the Kelvin sign → 'k'), which would let them pass a grammar meant to refuse them.
export const asciiUpper = s => s.replace(/[a-z]+/g, m => m.toUpperCase());
export const asciiLower = s => s.replace(/[A-Z]+/g, m => m.toLowerCase());

// A lone surrogate: text no UTF-8 store can hold (a pair is one code point under /u).
export const LONE_SURROGATE = /[\ud800-\udfff]/u;

// A string input, trimmed. Refuses a non-string, input over `max`, a lone
// surrogate, a character `control` matches (null: no control check) and,
// unless `empty`, blank input.
export function text(value, path, type, { max = MAX_INPUT, control = CONTROL, empty = false } = {}) {
  if (typeof value !== 'string' || value.length > max || control?.test(value) || LONE_SURROGATE.test(value)) return fail(path, type);
  const raw = value.trim();
  if (!raw && !empty) return fail(path, type);
  return raw;
}

// A number as form and query input spells it, exponent allowed: read with Number().
export const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

// An exact decimal: optional sign, digits, optional fraction, no exponent.
// A pattern source, for embedding in a larger grammar.
export const EXACT_DECIMAL = '[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)';

// An EXACT_DECIMAL as a scaled integer, compared and bounded without rounding
// through IEEE doubles: value = n / 10^scale. `text` is its canonical spelling,
// with no leading or trailing zeros and no sign on zero.
export function exactDecimal(literal) {
  const negative = literal[0] === '-';
  const [whole, fraction = ''] = literal.replace(/^[+-]/, '').split('.');
  const integer = (whole || '0').replace(/^0+(?=\d)/, '');
  const digits = fraction.replace(/0+$/, '');
  const n = BigInt(integer + digits) * (negative ? -1n : 1n);
  return { n, scale: digits.length, text: `${n < 0n ? '-' : ''}${integer}${digits ? '.' + digits : ''}` };
}

// A decimal as typed, exponent allowed ("1.5e3", "-.25"), as exactDecimal()'s
// canonical text; null when it isn't one. The exponent is bounded so the
// expansion stays small.
export function decimalText(raw) {
  const m = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d{1,3}))?$/i.exec(raw);
  if (!m || !(m[2] || m[3])) return null;
  let digits = (m[2] || '') + (m[3] || '');
  let point = (m[2] || '').length + Number(m[4] || 0);
  if (point < 0) { digits = '0'.repeat(-point) + digits; point = 0; }
  if (point > digits.length) digits += '0'.repeat(point - digits.length);
  const fraction = digits.slice(point);
  return exactDecimal(`${m[1]}${digits.slice(0, point) || '0'}${fraction ? '.' + fraction : ''}`).text;
}
