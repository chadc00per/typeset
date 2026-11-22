// language: Registered language code, canonical lowercase.
import { test } from 'node:test';
import { Language } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('language: a registered CLDR code, lowercase', () => {
  accepts(Language, [['EN', 'en'], ['fil', 'fil']]);
  refuses(Language, ['xx', 'en-US', 'english']);
});

test('language: lookalikes that case mapping folds into ASCII are refused', () => {
  refuses(Language, ['\u212ak']);
});
