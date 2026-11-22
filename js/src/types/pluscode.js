// pluscode: a full (global) Open Location Code, uppercase: eight digits, '+',
// then none or two to seven more. Padding zeros fill even positions up to the
// '+' with nothing after it. Short codes need a reference locality, so they're refused.
import { fail } from '../lib/errors.js';
import { asciiUpper, text } from '../lib/text.js';

export const definition = {
  name: 'pluscode',
  description: 'Full Open Location Code (plus code), uppercase',
  example: '849VCWC8+R9',
  className: 'PlusCode'
};

// Open Location Code digits, in value order.
const OLC = '23456789CFGHJMPQRVWX';

export function normalize(value, path, type) {
  const code = asciiUpper(text(value, path, type, { max: 64 }));
  if (code.indexOf('+') !== 8 || code.lastIndexOf('+') !== 8) return fail(path, type, 'full code such as 849VCWC8+R9');
  const head = code.slice(0, 8), tail = code.slice(9), padding = head.indexOf('0');
  if (tail.length === 1 || tail.length > 7) return fail(path, type);
  if (padding !== -1 && (padding === 0 || padding % 2 || !/^0+$/.test(head.slice(padding)) || tail)) return fail(path, type);
  const digits = (padding === -1 ? head : head.slice(0, padding)) + tail;
  if (![...digits].every(c => OLC.includes(c)) || OLC.indexOf(code[0]) > 8 || OLC.indexOf(code[1]) > 17) return fail(path, type);
  return code;
}
