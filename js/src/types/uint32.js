// uint32: a whole number 0 through 4294967295.
import { number } from '../lib/number.js';

export const definition = {
  name: 'uint32',
  description: 'Unsigned 32-bit integer',
  example: '4294967295',
  storage: 'number',
  step: 1,
  className: 'UInt32'
};

export function normalize(value, path, type) {
  return number(value, path, type, { whole: true, min: 0, max: 4294967295 });
}
