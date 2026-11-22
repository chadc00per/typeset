// money: an amount and its currency, { amount, currency }. The amount stays an
// exact decimal string, written with at least the currency's minor-unit digits
// ("12.5 usd" → { amount: '12.50', currency: 'USD' }). More digits than that are
// kept (unit prices); negative amounts are allowed (refunds, balances). Text
// input puts the code on either side: "USD 12.50" or "12.50 USD". A written
// amount has no exponent; a number amount is read as its shortest spelling.
import { currencies, currencyCode } from '../lib/currencies.js';
import { fail } from '../lib/errors.js';
import { decimalText, text } from '../lib/text.js';

export const definition = {
  name: 'money',
  description: 'Exact decimal amount with its ISO 4217 currency, { amount, currency }',
  example: '12.50 USD',
  storage: 'object',
  constraints: 'value',
  control: 'money'
};

export function normalize(value, path, type) {
  let amount, code;
  if (typeof value === 'string') {
    const raw = text(value, path, type, { max: 256 });
    const front = /^([A-Za-z]{3})[ \t]*([+-]?[\d.]+)$/.exec(raw), back = /^([+-]?[\d.]+)[ \t]*([A-Za-z]{3})$/.exec(raw);
    if (front) [, code, amount] = front;
    else if (back) [, amount, code] = back;
    else return fail(path, type, 'amount and currency, such as 12.50 USD');
  } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    if (Object.keys(value).some(key => key !== 'amount' && key !== 'currency')) return fail(path, type, '{ amount, currency }');
    ({ amount, currency: code } = value);
    if (typeof amount === 'number' && Number.isFinite(amount)) amount = String(amount);
    else if (typeof amount === 'bigint') amount = String(amount);
    else if (typeof amount === 'string' && /e/i.test(amount)) return fail(`${path}.amount`, 'decimal', 'no exponent');
  } else return fail(path, type, '{ amount, currency }');
  const unit = currencyCode(code, `${path}.currency`, 'currency');
  const exact = typeof amount === 'string' && amount.length <= 256 ? decimalText(amount.trim()) : null;
  if (exact === null || exact.length > 256) return fail(`${path}.amount`, 'decimal');
  const [whole, fraction = ''] = exact.split('.');
  const digits = Math.max(fraction.length, currencies[unit] ?? 0);
  return { amount: digits ? `${whole}.${fraction.padEnd(digits, '0')}` : whole, currency: unit };
}

// Whole minor units (cents), the form a ledger stores: { minor, currency },
// `minor` as decimal digits so no amount rounds through a double. A store that
// keeps cents (an integer column) and this type's decimal
// amount mean different numbers for the same { amount: 1999 }, so values cross
// between them only through these, exactly or not at all.
const MINOR = /^[+-]?\d{1,256}$/;

// Money.toMinor(): any money input as whole minor units: "12.5 USD" → { minor: '1250', currency: 'USD' }.
// An amount finer than the currency's minor unit, or a currency without one (XAU), is refused.
function toMinor(value, path = 'money') {
  const { amount, currency } = normalize(value, path, 'money');
  const exponent = currencies[currency];
  if (exponent === null) return fail(path, 'money', `${currency} has no minor unit`);
  const [whole, fraction = ''] = amount.replace(/^-/, '').split('.');
  // normalize() writes at least `exponent` digits, and any more are significant.
  if (fraction.length > exponent) return fail(`${path}.amount`, 'money', `finer than ${currency}'s minor unit`);
  const minor = BigInt(whole + fraction.padEnd(exponent, '0'));
  return { minor: String(amount.startsWith('-') ? -minor : minor), currency };
}

// Money.fromMinor(): { minor, currency } (minor as digits, a safe integer or a bigint) as this type's value:
// { minor: 1250, currency: 'usd' } → { amount: '12.50', currency: 'USD' }.
function fromMinor(value, path = 'money') {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => key !== 'minor' && key !== 'currency')) {
    return fail(path, 'money', '{ minor, currency }');
  }
  const { minor, currency: code } = value;
  if (!(typeof minor === 'bigint' || Number.isSafeInteger(minor) || (typeof minor === 'string' && MINOR.test(minor)))) {
    return fail(`${path}.minor`, 'money', 'whole minor units');
  }
  const currency = currencyCode(code, `${path}.currency`, 'currency');
  const exponent = currencies[currency];
  if (exponent === null) return fail(path, 'money', `${currency} has no minor unit`);
  const units = BigInt(minor);
  const digits = String(units < 0n ? -units : units).padStart(exponent + 1, '0');
  const amount = `${units < 0n ? '-' : ''}${digits.slice(0, digits.length - exponent)}${exponent ? '.' + digits.slice(-exponent) : ''}`;
  return normalize({ amount, currency }, path, 'money');
}

export const methods = { toMinor, fromMinor };
