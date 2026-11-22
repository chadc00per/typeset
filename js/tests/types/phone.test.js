// phone: Phone number, normalized to E.164.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Phone } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('phone: E.164, vanity letters mapped, bare 10/11 digits read as US', () => {
  accepts(Phone, [['212-555-0123', '+12125550123'], ['1 (212) 555-0123', '+12125550123'], [2125550123, '+12125550123'], ['+44 20 7946 0958', '+442079460958']]);
  refuses(Phone, ['', '+', '+0', '555-0123', '+1 000 000 0000', null, []]);
});

test('phone: a refusal names the path, like every other type', () => {
  assert.throws(() => Phone.normalize('+', 'user.phone'), { message: 'user.phone must be a valid phone number' });
});

test('phone: a number input is a positive whole number', () => {
  assert.equal(Phone.normalize(2125550123), '+12125550123');
  refuses(Phone, [212555012.3, -2125550123, 0, NaN, Infinity]);
});

test('phone: oversized input is refused before it is read', () => {
  refuses(Phone, ['2125550123' + ' '.repeat(300)]);
});

// The numbering plans are libphonenumber's metadata, which the npm and PyPI
// ports release separately; both are pinned to one release (package.json,
// pyproject.toml). These numbers changed between releases, so the spec
// vectors (and the Python suite) catch a dependency that drifts.
test('phone: the pinned libphonenumber metadata release', () => {
  accepts(Phone, [['+641530633493', '+641530633493'], ['+641474568465', '+641474568465'], ['+6401714939013', '+641714939013']]);
  refuses(Phone, ['+6411756971419', '+593930808941', '+2639574575']);
});

test('phone: a character outside the written-number set is refused, not dropped', () => {
  refuses(Phone, ['+64\u06601714939013', '\uff12\uff11\uff12\uff15\uff15\uff15\uff10\uff11\uff12\uff13', '1-800-FLOWER\u212a', '+1 212 555 0123 \u2706']);
  accepts(Phone, [['+1 212\u00a0555\u20130123', '+12125550123'], ['+1 (212) 555\u22120123', '+12125550123']]);
});
