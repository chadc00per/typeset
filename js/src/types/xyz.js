// xyz: a point [x, y, z] of three finite numbers, unbounded.
import { point } from '../lib/point.js';

export const definition = {
  name: 'xyz',
  description: 'Three finite numbers [x, y, z]',
  example: '[10, 20, 30]',
  storage: 'array',
  constraints: 'none',
  control: 'coordinates',
  className: 'XYZ'
};

export function normalize(value, path) {
  return point(value, path, { size: 3, shape: 'an [x, y, z] triple', finite: '3 finite numbers ([x, y, z])' });
}
