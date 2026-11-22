// ulid: ULID, 26 uppercase Crockford base32 characters.
import { test } from 'node:test';
import { Ulid } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('ulid: Crockford base32, look-alikes read as digits', () => {
  accepts(Ulid, [['01arz3ndektsv4rrffq69g5fav', '01ARZ3NDEKTSV4RRFFQ69G5FAV'], ['OLARZ3NDEKTSV4RRFFQ69G5FAV', '01ARZ3NDEKTSV4RRFFQ69G5FAV']]);
  refuses(Ulid, ['81ARZ3NDEKTSV4RRFFQ69G5FAV', '01ARZ3NDEKTSV4RRFFQ69G5FAU', '01ARZ3NDEKTSV4RRFFQ69G5FA']);
});

test('ulid: lookalikes that case mapping folds into ASCII are refused', () => {
  refuses(Ulid, ['01ARZ3NDEKTSV4RRFFQ69G5F\ufb00']);
});
