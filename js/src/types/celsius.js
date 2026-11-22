// celsius: a Celsius temperature with its explicit unit, stored as "52°C"; at or
// above absolute zero.
import { temperature } from '../lib/temperature.js';

export const definition = {
  name: 'celsius',
  description: 'Celsius temperature string, explicit °C, at or above absolute zero',
  example: '52°C'
};

export function normalize(value, path, type) {
  return temperature(value, path, type, { unit: '°C', absoluteZero: -27315n });
}
