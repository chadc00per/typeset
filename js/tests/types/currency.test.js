// currency: Current ISO 4217 currency code, uppercase.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Currency } from '../../src/index.js';
import data from '../../../data/currency.json' with { type: 'json' };
import { accepts, refuses } from '../helpers.js';

test('currency: a current ISO 4217 code, uppercase', () => {
  accepts(Currency, [['usd', 'USD'], [' jpy ', 'JPY'], ['XAU', 'XAU']]);
  refuses(Currency, ['US', 'ABC', 'usdollar', '', 840]);
  for (const code of Object.keys(data.currencies)) assert.equal(Currency.normalize(code), code);
});

test('minorUnits() is each code\'s exponent, null for none, and a copy', () => {
  const units = Currency.minorUnits();
  assert.equal(units.USD, 2);
  assert.equal(units.JPY, 0);
  assert.equal(units.XAU, null);
  units.USD = 9;
  assert.equal(Currency.minorUnits().USD, 2);
});

test('currency: lookalikes that case mapping folds into ASCII are refused', () => {
  refuses(Currency, ['u\u017fd', 'U\u017fD']);
});
