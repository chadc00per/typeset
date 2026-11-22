// int32: a whole number in the signed 32-bit range.
import { number } from '../lib/number.js';

export const definition = {
  name: 'int32',
  description: 'Signed 32-bit integer',
  example: '2147483647',
  storage: 'number',
  step: 1
};

export function normalize(value, path, type) {
  return number(value, path, type, { whole: true, min: -2147483648, max: 2147483647 });
}
