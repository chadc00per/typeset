// integer: a whole number within the safe range (±2⁵³−1).
import { number } from '../lib/number.js';

export const definition = {
  name: 'integer',
  description: 'Safe signed whole number',
  example: '42',
  storage: 'number',
  step: 1
};

export function normalize(value, path, type) {
  return number(value, path, type, { whole: true });
}
