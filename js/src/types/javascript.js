// javascript: JavaScript source, a script or a module, checked by parsing it with
// acorn at its latest ECMAScript version (src/lib/code.js). Stored as written:
// trimmed, with CRLF and CR line endings as LF. Parsed, never run.
import { parses } from '../lib/code.js';
import { fail } from '../lib/errors.js';
import { MAX_CODE, source } from '../lib/source.js';

export const definition = {
  name: 'javascript',
  description: 'JavaScript source, a script or module, syntax-checked by parsing; never run',
  example: 'const greeting = \'hello\';',
  control: 'textarea',
  className: 'JavaScript'
};

export function normalize(value, path, type) {
  const code = source(value, path, type, MAX_CODE);
  return parses.javascript(code) ? code : fail(path, type, 'syntax error');
}
