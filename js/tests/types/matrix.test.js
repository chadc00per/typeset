// matrix: Dense rectangular finite-number matrix, 1–64 rows and columns.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Matrix } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('matrix: dense, rectangular, finite', () => {
  accepts(Matrix, [[[[1, -0], [0, 1]], [[1, 0], [0, 1]]], [[[1, 2, 3]], [[1, 2, 3]]]]);
  refuses(Matrix, [[], [[1, 2], [3]], [[NaN]], [['1']], [[]]]);
  assert.throws(() => Matrix.normalize([[1, 2], [3]], 'm'), { message: 'm[1] must be a valid matrix (rectangular dense rows)' });
});
