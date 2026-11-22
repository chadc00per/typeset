// multiplier: a nonnegative finite factor; text may end in x or ×.
import { number } from '../lib/number.js';

export const definition = {
  name: 'multiplier',
  description: 'Nonnegative finite multiplier',
  example: '2x',
  storage: 'number',
  control: 'text'
};

export function normalize(value, path, type) {
  return number(value, path, type, { min: 0, unit: /[x×]$/i });
}
