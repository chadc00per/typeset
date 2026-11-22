// matrix: a dense rectangular matrix of finite numbers, 1–64 rows and columns.
import { matrix } from '../lib/matrix.js';

export const definition = {
  name: 'matrix',
  description: 'Dense rectangular finite-number matrix, 1–64 rows and columns',
  example: '[[1,0],[0,1]]',
  storage: 'array',
  constraints: 'none',
  collation: 'multikey',
  control: 'json'
};

export function normalize(value, path, type) {
  return matrix(value, path, type);
}
