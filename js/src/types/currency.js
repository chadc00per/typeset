// currency: a current ISO 4217 code, uppercase (data/currency.json).
import { currencies, currencyCode } from '../lib/currencies.js';

export const definition = {
  name: 'currency',
  description: 'Current ISO 4217 currency code, uppercase',
  example: 'USD'
};

export function normalize(value, path, type) {
  return currencyCode(value, path, type);
}

// Currency.minorUnits(): each code's minor-unit exponent (null = none), so an
// amount can be shown in major units without its own table.
export const methods = { minorUnits: () => ({ ...currencies }) };
