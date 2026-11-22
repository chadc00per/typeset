// font: Safe CSS font-family list; lowercase canonical family names.
import { test } from 'node:test';
import { Font } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('font: a safe family list, lowercase, quoted unless generic', () => {
  accepts(Font, [['Roboto, Sans-Serif', '"roboto", sans-serif'], ["'Open  Sans', serif", '"open sans", serif']]);
  refuses(Font, ['"serif"', 'inherit', 'url(x)', 'a;b', '"unclosed', 'a,,b', '']);
});

test('font: a family name is lowercased before NFC', () => {
  accepts(Font, [['J\u030cx', '"\u01f0x"'], ['\u01f0x', '"\u01f0x"']]);
});
