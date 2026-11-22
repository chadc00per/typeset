// datetimewindow: an ordered pair [start, end] of UTC timestamps, start not after end.
import { fail } from '../lib/errors.js';
import { instant } from '../lib/instant.js';

export const definition = {
  name: 'datetimewindow',
  description: 'Ordered inclusive pair of UTC ISO timestamps',
  example: '["2026-01-01T00:00:00Z", "2026-12-31T23:59:59Z"]',
  storage: 'array',
  constraints: 'none',
  collation: 'multikey',
  control: 'datetimewindow',
  className: 'DateTimeWindow'
};

export function normalize(value, path, type) {
  if (!Array.isArray(value) || value.length !== 2) return fail(path, type, '[start, end]');
  const pair = [instant(value[0], `${path}[0]`, type), instant(value[1], `${path}[1]`, type)];
  if (pair[0] > pair[1]) return fail(path, type, 'start must not be after end');
  return pair;
}
