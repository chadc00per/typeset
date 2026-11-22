// probability: 0 through 1.
import { number } from '../lib/number.js';

export const definition = {
  name: 'probability',
  description: 'Probability, 0 through 1',
  example: '0.75',
  storage: 'number',
  control: 'text'
};

export function normalize(value, path, type) {
  return number(value, path, type, { min: 0, max: 1 });
}
