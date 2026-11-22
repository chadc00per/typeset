// tag: Label: lowercase, whitespace collapsed, at most 64 characters.
import { test } from 'node:test';
import { Tag } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('tag: lowercase, whitespace collapsed, leading # dropped', () => {
  accepts(Tag, [['  Digital   Signage ', 'digital signage'], ['#Featured', 'featured'], ['Café', 'café']]);
  refuses(Tag, ['', '#', 'a,b', 'a\tb', '-lead', 'x'.repeat(65)]);
});

test('tag: lowercased before NFC, so the stored tag is a fixed point', () => {
  // NFC leaves J + caron decomposed (no precomposed capital); lowercasing makes it composable.
  accepts(Tag, [['J\u030c', '\u01f0'], ['\u03aa\u0301', '\u0390']]);
});

test('tag: a lone surrogate is refused (src/lib/text.js), a surrogate pair is one character', () => {
  refuses(Tag, ['a\ud800', '\udc00b', 'a\udc00\ud800']);
  accepts(Tag, [['a\ud835\udcb6', 'a\ud835\udcb6']]);
});
