// fahrenheit: a Fahrenheit temperature with its explicit unit, stored as "52°F"; at or
// above absolute zero.
import { temperature } from '../lib/temperature.js';

export const definition = {
  name: 'fahrenheit',
  description: 'Fahrenheit temperature string, explicit °F, at or above absolute zero',
  example: '125.6°F'
};

export function normalize(value, path, type) {
  return temperature(value, path, type, { unit: '°F', absoluteZero: -45967n });
}
