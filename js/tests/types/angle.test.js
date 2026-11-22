// angle: Degrees normalized into [0, 360).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Angle } from '../../src/index.js';
import { accepts } from '../helpers.js';

test('angle: deg and ° accepted, wrapped into [0, 360)', () => {
  accepts(Angle, [['450deg', 90], ['-90°', 270], [360, 0]]);
});

test('angle: validate() takes only the wrapped value', () => {
  assert.throws(() => Angle.validate(450), /canonical value required/);
});
