// timeprecision: Fixed time precision unit: ns, us, ms, s, m, h, d.
import { test } from 'node:test';
import { TimePrecision } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('timeprecision: one fixed unit', () => {
  accepts(TimePrecision, [['MS', 'ms'], ['ns', 'ns']]);
  refuses(TimePrecision, ['sec', 'μs', '']);
});
