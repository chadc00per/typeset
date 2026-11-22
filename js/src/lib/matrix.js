// Dense numeric matrices shared by matrix and transformmatrix.
import { fail } from './errors.js';

// Rectangular rows of finite numbers, 1–64 rows and columns. `square`: the sizes
// allowed for a square matrix (transformmatrix's 3 and 4), checked before any cell.
export function matrix(value, path, type, { square } = {}) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 64) return fail(path, type, '1–64 rows and columns');
  const columns = value[0]?.length;
  if (!Number.isInteger(columns) || columns < 1 || columns > 64) return fail(path, type);
  if (square && (!square.includes(value.length) || columns !== value.length)) return fail(path, type, square.map(n => `${n}×${n}`).join(' or '));
  const result = [];
  for (let row = 0; row < value.length; row++) {
    if (!Object.hasOwn(value, row) || !Array.isArray(value[row]) || value[row].length !== columns) return fail(`${path}[${row}]`, type, 'rectangular dense rows');
    const cells = [];
    for (let col = 0; col < columns; col++) {
      const n = value[row][col];
      if (!Object.hasOwn(value[row], col) || typeof n !== 'number' || !Number.isFinite(n)) return fail(`${path}[${row}][${col}]`, type, 'finite numbers');
      cells.push(Object.is(n, -0) ? 0 : n);
    }
    result.push(cells);
  }
  return result;
}
