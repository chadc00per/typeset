// roman: Canonical uppercase Roman numeral, 1 through 3999.
import { test } from 'node:test';
import { Roman } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('roman: canonical uppercase, 1 through 3999', () => {
  accepts(Roman, [['xlii', 'XLII'], ['MMMCMXCIX', 'MMMCMXCIX']]);
  refuses(Roman, ['IIII', 'MMMM', 'IC', '']);
});

test('roman: lookalikes that case mapping folds into ASCII are refused', () => {
  refuses(Roman, ['x\u0131v']);
});
