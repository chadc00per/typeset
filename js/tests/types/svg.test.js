// svg: SVG document: well-formed XML with an <svg> root, stored as written (not sanitized).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Svg } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

const SVG = 'http://www.w3.org/2000/svg';

test('svg: well-formed XML with an <svg> root, kept as written', () => {
  accepts(Svg, [
    [`<svg xmlns="${SVG}" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>`, `<svg xmlns="${SVG}" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>`],
    ['<svg><rect/></svg>', '<svg><rect/></svg>'],
    ['<?xml version="1.0"?>\n<svg/>', '<?xml version="1.0"?>\n<svg/>'],
    ['<!DOCTYPE svg><svg/>', '<!DOCTYPE svg><svg/>'],
    [`<s:svg xmlns:s="${SVG}"/>`, `<s:svg xmlns:s="${SVG}"/>`],
    ['<svg>\r\n  <g/>\r\n</svg>', '<svg>\n  <g/>\n</svg>']
  ]);
});

test('svg: anything but well-formed XML with an <svg> root is refused', () => {
  refuses(Svg, ['<svg><g></svg>', '<html/>', '<svg xmlns="http://www.w3.org/1999/xhtml"/>', '<svg/><svg/>', '<svg a="1" a="2"/>',
    '<svg>&nbsp;</svg>', 'text<svg/>', '<svg xlink:href="x"/>', '<svg', '', 42, null]);
  assert.throws(() => Svg.normalize('<html/>', 'icon'), { message: 'icon must be a valid SVG document (well-formed XML with an <svg> root)' });
});

test('svg: markup is stored as written, scripts included (not sanitized)', () => {
  assert.equal(Svg.normalize('<svg><script>alert(1)</script></svg>'), '<svg><script>alert(1)</script></svg>');
});
