// compassdirection: one of the sixteen compass points, uppercase.
import { fail } from '../lib/errors.js';
import { asciiUpper, CONTROL_EXCEPT_TAB, text } from '../lib/text.js';

export const definition = {
  name: 'compassdirection',
  description: 'Sixteen-point compass direction, uppercase',
  example: 'NW',
  className: 'CompassDirection',
  options: Object.freeze(['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'])
};

export function normalize(value, path, type) {
  const point = asciiUpper(text(value, path, type, { max: 256, control: CONTROL_EXCEPT_TAB, empty: true }));
  return definition.options.includes(point) ? point : fail(path, type);
}
