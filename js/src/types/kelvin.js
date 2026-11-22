// kelvin: a Kelvin temperature with its explicit unit K, written without a
// degree sign, stored as "300K"; not below 0 K.
import { temperature } from '../lib/temperature.js';

export const definition = {
  name: 'kelvin',
  description: 'Kelvin temperature string, explicit K, at or above absolute zero',
  example: '300K'
};

export function normalize(value, path, type) {
  return temperature(value, path, type, { unit: 'K', absoluteZero: 0n });
}
