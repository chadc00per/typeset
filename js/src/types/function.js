// function: the source code of one function in this package's own language,
// stored as text: trimmed, with CRLF and CR line endings as LF. Here that is
// JavaScript: a function expression or declaration, an arrow function, or an
// async or generator one, checked by parsing it with acorn at its latest
// ECMAScript version. The source is only parsed, never run. A function value
// is read as its source text. This is the one type whose accepted inputs
// differ by language: the Python package's `function` holds Python source.
import { fail } from '../lib/errors.js';
import { source } from '../lib/source.js';
import { parseJavaScript } from '../lib/code.js';

export const definition = {
  name: 'function',
  description: 'Source code of one function in the package\'s own language (JavaScript in npm, Python in PyPI), parsed but never run',
  example: '(a, b) => a + b',
  control: 'textarea',
  className: 'Fn',
  // What the Python package describes differently: its own example.
  runtimeSpecific: { python: { example: 'lambda a, b: a + b' } }
};

const MAX_SOURCE = 65536;
const FUNCTIONS = new Set(['FunctionExpression', 'ArrowFunctionExpression']);

// Whether `source` is exactly one function. Parenthesized, a declaration reads as
// a function expression, and anything around the function (a call, a second
// statement, a comma) leaves the program something other than one function.
// The newline ends a trailing // comment before the closing parenthesis.
// A syntax error, or nesting past code.js's caps, is not a function either.
function isFunction(source) {
  const program = parseJavaScript(`(${source}\n)`, 'script');
  return program !== null && program.body.length === 1 && program.body[0].type === 'ExpressionStatement' && FUNCTIONS.has(program.body[0].expression.type);
}

export function normalize(value, path, type) {
  if (typeof value === 'function') value = Function.prototype.toString.call(value);
  const code = source(value, path, type, MAX_SOURCE);
  return isFunction(code) ? code : fail(path, type, 'one function');
}
