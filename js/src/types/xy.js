// xy: a point [x, y] of two finite numbers, unbounded.
import { point } from '../lib/point.js';

export const definition = {
  name: 'xy',
  description: 'Two finite numbers [x, y]',
  example: '[100, 200]',
  storage: 'array',
  constraints: 'none',
  control: 'coordinates',
  className: 'XY'
};

export function normalize(value, path) {
  return point(value, path, { size: 2, shape: 'an [x, y] pair', finite: '2 finite numbers ([x, y])' });
}
