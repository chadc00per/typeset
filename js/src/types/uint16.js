// uint16: a whole number 0 through 65535.
import { number } from '../lib/number.js';

export const definition = {
  name: 'uint16',
  description: 'Unsigned 16-bit integer',
  example: '65535',
  storage: 'number',
  step: 1,
  className: 'UInt16'
};

export function normalize(value, path, type) {
  return number(value, path, type, { whole: true, min: 0, max: 65535 });
}
