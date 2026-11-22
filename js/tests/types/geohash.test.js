// geohash: Geohash, 1–12 lowercase base32 characters.
import { test } from 'node:test';
import { Geohash } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('geohash: base32 alphabet, 1–12 characters', () => {
  accepts(Geohash, [['9Q8YYK', '9q8yyk'], ['u', 'u']]);
  refuses(Geohash, ['9q8yya', '9q8yyi', '9q8yyl', '9q8yyo', '', '9q8yyk9q8yyk9']);
});

test('geohash: lookalikes that case mapping folds into ASCII are refused', () => {
  refuses(Geohash, ['9q8yy\u212a']);
});
