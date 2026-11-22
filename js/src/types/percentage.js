// percentage: percentage points 0 through 100; text may end in %.
import { number } from '../lib/number.js';

export const definition = {
  name: 'percentage',
  description: 'Percentage points, 0 through 100',
  example: '25%',
  storage: 'number',
  control: 'text'
};

export function normalize(value, path, type) {
  return number(value, path, type, { min: 0, max: 100, unit: /%$/ });
}
