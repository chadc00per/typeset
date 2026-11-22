// css: CSS stylesheet or declaration list with no syntax errors.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Css } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('css: a stylesheet or a declaration list, kept as written', () => {
  accepts(Css, [
    ['p { color: #333; }', 'p { color: #333; }'],
    ['color: red; margin: 0', 'color: red; margin: 0'],
    ['@media (min-width: 1px) { a { b: c } }', '@media (min-width: 1px) { a { b: c } }'],
    ['a {} b {}', 'a {} b {}'],
    ['@import url(x.css);', '@import url(x.css);'],
    [".a:hover > .b::before { content: '}' }", ".a:hover > .b::before { content: '}' }"],
    ['/* only a comment */', '/* only a comment */'],
    ['div { color: red !important; }', 'div { color: red !important; }'],
    ['a {\r\n  b: c;\r\n}', 'a {\n  b: c;\n}']
  ]);
});

test('css: a syntax error, unbalanced brackets or an empty declaration is refused', () => {
  refuses(Css, ['a { color: red', 'a { b: c } }', '}', '{', '@@@', 'a { color: }', 'color:', "a { content: 'open }",
    '/* open', `a { b: ${'('.repeat(300)}${')'.repeat(300)} }`, '', 42, null]);
  assert.throws(() => Css.normalize('a {', 'style'), { message: 'style must be a valid CSS stylesheet (syntax error)' });
});
