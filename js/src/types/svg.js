// svg: a well-formed XML document whose root is <svg>, in the SVG namespace or
// none, checked with saxes (src/lib/code.js). Stored as written, not sanitized:
// it may hold scripts, so sanitize it before rendering it. Trimmed, with CRLF
// and CR line endings as LF.
import { parses } from '../lib/code.js';
import { fail } from '../lib/errors.js';
import { MAX_CODE, source } from '../lib/source.js';

export const definition = {
  name: 'svg',
  description: 'SVG document: well-formed XML with an <svg> root, stored as written (not sanitized)',
  example: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>',
  control: 'textarea'
};

export function normalize(value, path, type) {
  const code = source(value, path, type, MAX_CODE);
  return parses.svg(code) ? code : fail(path, type, 'well-formed XML with an <svg> root');
}
