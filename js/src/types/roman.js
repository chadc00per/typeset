// roman: a canonical uppercase Roman numeral, 1 through 3999.
import { fail } from '../lib/errors.js';
import { asciiUpper, text } from '../lib/text.js';

export const definition = {
  name: 'roman',
  description: 'Canonical uppercase Roman numeral, 1 through 3999',
  example: 'XV'
};

const ROMAN = /^(?=.)M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

export function normalize(value, path, type) {
  const upper = asciiUpper(text(value, path, type));
  return ROMAN.test(upper) ? upper : fail(path, type);
}
