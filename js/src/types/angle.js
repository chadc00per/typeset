// angle: degrees, wrapped into [0, 360); text may end in deg or °.
import { number } from '../lib/number.js';

export const definition = {
  name: 'angle',
  description: 'Degrees normalized into [0, 360)',
  example: '450deg',
  storage: 'number',
  control: 'text'
};

export function normalize(value, path, type) {
  return number(value, path, type, { unit: /(?:deg|°)$/i, wrap: 360 });
}
