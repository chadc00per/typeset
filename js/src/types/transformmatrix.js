// transformmatrix: a row-major 3×3 or 4×4 homogeneous transform matrix.
import { matrix } from '../lib/matrix.js';

export const definition = {
  name: 'transformmatrix',
  description: 'Row-major 3×3 or 4×4 homogeneous transform matrix',
  example: '[[1,0,0],[0,1,0],[0,0,1]]',
  storage: 'array',
  constraints: 'none',
  collation: 'multikey',
  control: 'json',
  className: 'TransformMatrix'
};

export function normalize(value, path, type) {
  return matrix(value, path, type, { square: [3, 4] });
}
