// transformmatrix: Row-major 3×3 or 4×4 homogeneous transform matrix.
import { test } from 'node:test';
import { TransformMatrix } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('transformmatrix: 3×3 or 4×4', () => {
  accepts(TransformMatrix, [[[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[1, 0, 0], [0, 1, 0], [0, 0, 1]]]]);
  refuses(TransformMatrix, [[[1, 0], [0, 1]], [[1, 0, 0], [0, 1, 0]]]);
});
