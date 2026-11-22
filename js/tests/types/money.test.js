// money: Exact decimal amount with its ISO 4217 currency, { amount, currency }.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Money } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('money: exact amount, at least the minor-unit digits, and its currency', () => {
  accepts(Money, [
    ['12.5 usd', { amount: '12.50', currency: 'USD' }],
    ['USD 12.50', { amount: '12.50', currency: 'USD' }],
    ['JPY 1000', { amount: '1000', currency: 'JPY' }],
    ['12.505 USD', { amount: '12.505', currency: 'USD' }],
    ['-3 EUR', { amount: '-3.00', currency: 'EUR' }],
    [{ amount: 3, currency: 'eur' }, { amount: '3.00', currency: 'EUR' }],
    [{ amount: '1000', currency: 'BHD' }, { amount: '1000.000', currency: 'BHD' }],
    ['XAU 1.5', { amount: '1.5', currency: 'XAU' }]
  ]);
  refuses(Money, ['12 XYZ', '12,50 EUR', '12.50', 'USD', { amount: 'x', currency: 'USD' }, { amount: 1, currency: 'USD', note: 'x' }, { amount: NaN, currency: 'USD' }, [12, 'USD'], 12]);
  assert.deepEqual(Money.check({ amount: '1', currency: 'nope' }), { ok: false, issues: [{ path: 'currency', message: 'must be a valid currency code', code: 'invalid' }] });
  Money.validate({ amount: '12.50', currency: 'USD' });
  assert.throws(() => Money.validate({ amount: '12.5', currency: 'USD' }), /canonical value required/);
  assert.throws(() => Money.validate('12.50 USD'), /normalize input before validation/);
});

test('money: one exponent rule, bigint amounts, validation ignores key order', () => {
  refuses(Money, ['1e3 USD', { amount: '1e3', currency: 'USD' }]);
  assert.deepEqual(Money.normalize({ amount: 5n, currency: 'usd' }), { amount: '5.00', currency: 'USD' });
  accepts(Money, [[{ amount: 1e-7, currency: 'USD' }, { amount: '0.0000001', currency: 'USD' }]]);
  Money.validate({ currency: 'USD', amount: '12.50' });
});

// The same cases as python/tests/test_money.py: a ledger's minor units cross over exactly or not at all.
test('money: toMinor() and fromMinor() convert exactly to and from whole minor units', () => {
  const pairs = [['12.5 usd', '1250', 'USD', '12.50'], ['KWD -1.005', '-1005', 'KWD', '-1.005'], ['JPY 1000', '1000', 'JPY', '1000'], ['0.07 USD', '7', 'USD', '0.07']];
  for (const [input, minor, currency, amount] of pairs) {
    assert.deepEqual(Money.toMinor(input), { minor, currency });
    assert.deepEqual(Money.fromMinor({ minor, currency }), { amount, currency });
  }
  assert.deepEqual(Money.fromMinor({ minor: 1999, currency: 'usd' }), { amount: '19.99', currency: 'USD' });
  assert.deepEqual(Money.fromMinor({ minor: 5n, currency: 'JPY' }), { amount: '5', currency: 'JPY' });
  assert.throws(() => Money.toMinor('12.505 USD'), { message: "money.amount must be a valid amount of money (finer than USD's minor unit)" });
  assert.throws(() => Money.toMinor('XAU 1'), { message: 'money must be a valid amount of money (XAU has no minor unit)' });
  assert.throws(() => Money.fromMinor({ minor: 1.5, currency: 'USD' }), { message: 'money.minor must be a valid amount of money (whole minor units)' });
  assert.throws(() => Money.fromMinor({ amount: 1999, currency: 'USD' }), { message: 'money must be a valid amount of money ({ minor, currency })' });
  // A minor-units object is never read as an amount.
  assert.equal(Money.is({ minor: '1999', currency: 'USD' }), false);
});

