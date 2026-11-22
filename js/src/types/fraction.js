// fraction: a fraction of a whole, 0 through 1; text may be written a/b.
import { number } from '../lib/number.js';

export const definition = {
  name: 'fraction',
  description: 'Fraction of a whole, 0 through 1',
  example: '1/4',
  storage: 'number',
  control: 'text'
};

export function normalize(value, path, type) {
  return number(value, path, type, { min: 0, max: 1, ratio: true });
}
