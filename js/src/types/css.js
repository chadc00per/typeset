// css: a CSS stylesheet, or a declaration list as a style attribute holds, with
// no syntax errors, balanced brackets and no empty declarations, checked with
// css-tree (src/lib/code.js). Property values aren't checked against each
// property's grammar. Stored as written: trimmed, with CRLF and CR line endings as LF.
import { parses } from '../lib/code.js';
import { fail } from '../lib/errors.js';
import { MAX_CODE, source } from '../lib/source.js';

export const definition = {
  name: 'css',
  description: 'CSS stylesheet or declaration list with no syntax errors',
  example: 'p { color: #333; }',
  control: 'textarea'
};

export function normalize(value, path, type) {
  const code = source(value, path, type, MAX_CODE);
  return parses.css(code) ? code : fail(path, type, 'syntax error');
}
