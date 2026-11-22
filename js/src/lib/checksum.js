// Check digits shared by the product codes: GS1 (isbn, upc, gtin) and ISBN-10 (isbn, asin).
import { fail } from './errors.js';
import { asciiUpper, text } from './text.js';

// The GS1 check digit of a code's body: weights 3 and 1 from the right.
export function checkDigit(body) {
  let sum = 0, weight = 3;
  for (let i = body.length - 1; i >= 0; i--) { sum += Number(body[i]) * weight; weight = 4 - weight; }
  return String((10 - sum % 10) % 10);
}
export function validGS1(digits) { return checkDigit(digits.slice(0, -1)) === digits.at(-1); }
// Ten characters, the last possibly X (10), whose weighted sum is a multiple of 11.
export function validIsbn10(digits) {
  if (!/^\d{9}[\dX]$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += (digits[i] === 'X' ? 10 : Number(digits[i])) * (10 - i);
  return sum % 11 === 0;
}
// Digits (and X) in groups separated by spaces or hyphens, joined and uppercase.
export function digitGroups(value, path, type) {
  const raw = text(value, path, type);
  if (!/^[0-9Xx]+(?:[ -]+[0-9Xx]+)*$/.test(raw)) return fail(path, type);
  return asciiUpper(raw.replace(/[ -]/g, ''));
}
