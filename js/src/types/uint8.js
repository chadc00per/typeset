// uint8: a whole number 0 through 255.
import { number } from '../lib/number.js';

export const definition = {
  name: 'uint8',
  description: 'Unsigned 8-bit integer',
  example: '255',
  storage: 'number',
  step: 1,
  className: 'UInt8'
};

export function normalize(value, path, type) {
  return number(value, path, type, { whole: true, min: 0, max: 255 });
}
