// phone: a phone number in E.164, checked by Google's libphonenumber. Vanity
// letters map to digits, and 10- or 11-digit numbers without + read as US/Canada.
import { fail } from '../lib/errors.js';
import { asciiLower } from '../lib/text.js';
import { phoneNumbers } from '#vendor';

export const definition = {
  name: 'phone',
  description: 'Phone number, normalized to E.164',
  example: '+12125550123',
  constraints: 'none',
  control: 'tel'
};

const MAX_INPUT = 256;
const LETTER_DIGITS = {
  a: '2', b: '2', c: '2', d: '3', e: '3', f: '3', g: '4', h: '4', i: '4', j: '5', k: '5', l: '5',
  m: '6', n: '6', o: '6', p: '7', q: '7', r: '7', s: '7', t: '8', u: '8', v: '8', w: '9', x: '9', y: '9', z: '9'
};
// What a written number may hold: ASCII letters (vanity), digits, '+',
// whitespace, ASCII punctuation and the Unicode dashes and minus sign. Any
// other character is refused rather than dropped: a non-ASCII digit ('٠') would
// otherwise vanish and leave a different number, and a lookalike letter (the
// Kelvin sign) would read as a vanity letter.
const WRITTEN = /^[0-9A-Za-z+\s!-/:-@[-`{-~\u2010-\u2015\u2212]*$/;
let phoneUtil;

// A number is its digits, so it must be a positive whole number: 212555012.3
// would otherwise lose its point and read as a different, valid number.
export function normalize(value, path, type) {
  if (typeof value === 'number' ? !Number.isSafeInteger(value) || value <= 0
    : typeof value !== 'string' || value.length > MAX_INPUT) return fail(path, type);
  const raw = String(value);
  if (!WRITTEN.test(raw)) return fail(path, type);
  let cleaned = asciiLower(raw)
    .replace(/\s+/g, '')
    .replace(/[^0-9a-z+]/g, '')
    .replace(/[a-z]/g, letter => LETTER_DIGITS[letter])
    .replace(/(?!^)\+/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) cleaned = '+1' + cleaned;
    else if (cleaned.length === 11 && cleaned.startsWith('1')) cleaned = '+' + cleaned;
    else return fail(path, type);
  }
  const { PhoneNumberUtil, PhoneNumberFormat } = phoneNumbers();
  phoneUtil ||= PhoneNumberUtil.getInstance();
  let number;
  // libphonenumber throws its own plain Error on unparseable input ("+", "+0"); that is a refusal too
  try { number = phoneUtil.parseAndKeepRawInput(cleaned); } catch { return fail(path, type); }
  if (!phoneUtil.isValidNumber(number)) return fail(path, type);
  return phoneUtil.format(number, PhoneNumberFormat.E164);
}
