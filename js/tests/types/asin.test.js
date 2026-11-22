// asin: Amazon ASIN: a valid ISBN-10 or B and nine letters or digits.
import { test } from 'node:test';
import { Asin } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('asin: ISBN-10 or B-prefixed', () => {
  accepts(Asin, [['b07xjwd3ky', 'B07XJWD3KY'], ['0306406152', '0306406152']]);
  refuses(Asin, ['0306406153', 'A07XJWD3KY', 'B07XJWD3K', 'B07XJWD3KY1']);
});

test('asin: lookalikes that case mapping folds into ASCII are refused', () => {
  refuses(Asin, ['b07xjwd3\u212ay']);
});
