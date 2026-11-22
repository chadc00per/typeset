// html: HTML fragment with no syntax errors, stored as written (not sanitized).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Html } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('html: a fragment with no parse errors, kept as written', () => {
  accepts(Html, [
    ['<p>Hello, <b>world</b></p>', '<p>Hello, <b>world</b></p>'],
    ['plain text', 'plain text'],
    ["<img src=a.png alt=''>", "<img src=a.png alt=''>"],
    ['<div>unclosed', '<div>unclosed'],
    ['<b><i>misnested</b></i>', '<b><i>misnested</b></i>'],
    ['<x-custom foo></x-custom>', '<x-custom foo></x-custom>'],
    ['<p>&amp; &lt;</p>', '<p>&amp; &lt;</p>'],
    ['<ul>\r\n  <li>a</li>\r\n</ul>', '<ul>\n  <li>a</li>\n</ul>']
  ]);
});

test('html: a syntax error is refused', () => {
  refuses(Html, ['<p class="a" class="b">dup</p>', '<div attr="unterminated>', '<!-- comment', '&notanentity;', '<p>&#0;</p>',
    '', 42, null]);
  assert.throws(() => Html.normalize('<!-- open', 'body'), { message: 'body must be a valid HTML fragment (syntax error)' });
});

test('html: markup is stored as written, scripts included (not sanitized)', () => {
  assert.equal(Html.normalize('<script>alert(1)</script>'), '<script>alert(1)</script>');
  assert.equal(Html.normalize('<a href="javascript:alert(1)" onclick="x()">x</a>'), '<a href="javascript:alert(1)" onclick="x()">x</a>');
});
