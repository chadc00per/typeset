// html: an HTML fragment with none of the HTML standard's parse errors, checked
// with parse5 (src/lib/code.js). Stored as written, not sanitized: it may hold
// scripts, so sanitize it before rendering it. Trimmed, with CRLF and CR line
// endings as LF.
import { parses } from '../lib/code.js';
import { fail } from '../lib/errors.js';
import { MAX_CODE, source } from '../lib/source.js';

export const definition = {
  name: 'html',
  description: 'HTML fragment with no syntax errors, stored as written (not sanitized)',
  example: '<p>Hello, <b>world</b></p>',
  control: 'textarea'
};

export function normalize(value, path, type) {
  const code = source(value, path, type, MAX_CODE);
  return parses.html(code) ? code : fail(path, type, 'syntax error');
}
