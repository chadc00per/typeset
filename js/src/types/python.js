// python: Python 3 source, checked by parsing it with Lezer's Python grammar
// (src/lib/code.js), the same parser in every runtime. Stored as written:
// trimmed, with CRLF and CR line endings as LF. Parsed, never run.
import { parses } from '../lib/code.js';
import { fail } from '../lib/errors.js';
import { MAX_CODE, source } from '../lib/source.js';

export const definition = {
  name: 'python',
  description: 'Python 3 source, syntax-checked by parsing; never run',
  example: 'print(\'hello\')',
  control: 'textarea'
};

export function normalize(value, path, type) {
  const code = source(value, path, type, MAX_CODE);
  return parses.python(code) ? code : fail(path, type, 'syntax error');
}
