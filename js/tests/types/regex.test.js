// regex: JavaScript regular expression as a /source/flags literal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { Regex } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('regex: compiled by RegExp, canonical /source/flags', () => {
  accepts(Regex, [['/a+b/ig', '/a+b/gi'], ['a/b', '/a\\/b/'], ['^[a-z]+$', '/^[a-z]+$/']]);
  refuses(Regex, ['/(/', '/x/gg', '/x/vu', '/x/q', '[']);
  assert.equal(Regex.normalize(/x/m), '/x/m');
});

test('regex: a RegExp from another realm is read; a look-alike object is refused', () => {
  assert.equal(Regex.normalize(vm.runInNewContext('/a+/gi')), '/a+/gi');
  assert.equal(Regex.normalize(/a+/ig), '/a+/gi');
  refuses(Regex, [{ source: 'a', flags: 'g' }, { [Symbol.toStringTag]: 'RegExp' }]);
});

test('regex: a RegExp meets the same limits as its literal', () => {
  refuses(Regex, [new RegExp(String.fromCharCode(0xd800)), new RegExp('a'.repeat(5000)), new RegExp(String.fromCharCode(1))]);
  accepts(Regex, [[/a\u{1f600}/u, '/a\\u{1f600}/u']]);
});
