// imei: a 15-digit IMEI with its Luhn check digit; spaces, dots, hyphens and slashes are dropped.
import { fail } from '../lib/errors.js';
import { text } from '../lib/text.js';

export const definition = {
  name: 'imei',
  description: 'Checksum-validated 15-digit IMEI',
  example: '490154203237518'
};

function luhn(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

export function normalize(value, path, type) {
  const raw = text(value, path, type, { max: 64 });
  if (!/^\d+(?:[ ./-]+\d+)*$/.test(raw)) return fail(path, type);
  const digits = raw.replace(/\D/g, '');
  return digits.length === 15 && luhn(digits) ? digits : fail(path, type, '15 digits with a valid check digit');
}
