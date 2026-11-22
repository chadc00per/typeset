// geo: a coordinate pair [longitude, latitude] on the globe.
import { ValidationError } from '../lib/errors.js';
import { point } from '../lib/point.js';

export const definition = {
  name: 'geo',
  description: 'Coordinate pair [longitude, latitude]',
  example: '[-73.9857, 40.7484]',
  storage: 'array',
  constraints: 'none',
  control: 'coordinates'
};

export function normalize(value, path) {
  const [lng, lat] = point(value, path, { size: 2, shape: 'a [lng, lat] coordinate pair', finite: 'a [lng, lat] coordinate pair' });
  if (lng < -180 || lng > 180) throw new ValidationError(`${path} longitude must be within [-180, 180]`, 'range');
  if (lat < -90 || lat > 90) throw new ValidationError(`${path} latitude must be within [-90, 90]`, 'range');
  return [lng, lat];
}
