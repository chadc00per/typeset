// Coordinate tuples shared by geo, xy and xyz. Numeric strings read as their
// number (form and query input); anything else must already be finite.
// A shape names what was expected, so these refusals read "<path> must be an
// [x, y] pair" rather than the usual "must be a valid".
import { ValidationError } from './errors.js';
import { DECIMAL } from './text.js';

// `size` numbers; `shape` describes the tuple, `finite` its numbers, in a refusal.
export function point(value, path, { size, shape, finite }) {
  if (!Array.isArray(value) || value.length !== size) throw new ValidationError(`${path} must be ${shape}`);
  return Array.from(value, n => {
    if (typeof n === 'string' && DECIMAL.test(n.trim())) n = Number(n);
    if (typeof n !== 'number' || !Number.isFinite(n)) throw new ValidationError(`${path} must be ${finite}`);
    return Object.is(n, -0) ? 0 : n;
  });
}
