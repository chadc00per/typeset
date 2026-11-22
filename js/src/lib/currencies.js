// The pinned ISO 4217 table (data/currency.json), shared by currency and money.
import { fail } from './errors.js';
import { asciiUpper, text } from './text.js';
import data from '../../../data/currency.json' with { type: 'json' };

// Each current code's minor-unit exponent (null = no minor unit).
export const { currencies } = data;

// A current ISO 4217 code, uppercase.
export function currencyCode(value, path, type) {
  const code = asciiUpper(text(value, path, type, { max: 64, control: null, empty: true }));
  return /^[A-Z]{3}$/.test(code) && Object.hasOwn(currencies, code) ? code : fail(path, type);
}
