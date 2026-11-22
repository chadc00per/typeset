// function: Source code of one function in the package's own language (JavaScript in npm, Python in PyPI), parsed but never run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Fn } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('function: one JavaScript function, kept as written', () => {
  accepts(Fn, [
    ['(a, b) => a + b', '(a, b) => a + b'],
    ['  x => x * 2\n', 'x => x * 2'],
    ['function add(a, b) { return a + b; }', 'function add(a, b) { return a + b; }'],
    ['function () {}', 'function () {}'],
    ['async function* items() { yield 1; }', 'async function* items() { yield 1; }'],
    ['async (url) => await fetch(url)', 'async (url) => await fetch(url)'],
    ['x => x // a trailing comment', 'x => x // a trailing comment'],
    ['/* leading */ x => x', '/* leading */ x => x'],
    ['(x => x)', '(x => x)']
  ]);
});

test('function: CRLF and CR line endings are stored as LF', () => {
  accepts(Fn, [['function f() {\r\n  return 1;\r\n}', 'function f() {\n  return 1;\n}'], ['x =>\rx', 'x =>\nx']]);
});

test('function: anything but exactly one function is refused', () => {
  refuses(Fn, [
    'x => x)(1', '1); evil(); (() => 1', 'a => 1, b => 2', 'x => x; y => y', 'f()', 'class A {}', '({ m() {} })',
    'function (', 'x =>', 'lambda a, b: a + b', 'def f(): pass', '', ' ', 42, null, {}, ['x => x'],
    'x => x\u0000', `${'('.repeat(40000)}x => x${')'.repeat(40000)}`, `x => ${'1+'.repeat(40000)}1`
  ]);
  assert.throws(() => Fn.normalize('x => x)(1', 'handler'), { message: 'handler must be a valid function (one function)' });
});

test('function: a function value is read as its source; a native one is refused', () => {
  assert.equal(Fn.normalize((a, b) => a * b), '(a, b) => a * b');
  assert.equal(Fn.normalize(function twice(x) { return x * 2; }), 'function twice(x) { return x * 2; }');
  refuses(Fn, [Math.max, class Box {}]);
});

test('function: the source is parsed, never run', () => {
  globalThis.typesetRan = false;
  Fn.normalize('(() => { globalThis.typesetRan = true; })');
  Fn.normalize('function f() { globalThis.typesetRan = true; }');
  assert.equal(globalThis.typesetRan, false);
  delete globalThis.typesetRan;
});

test('function: validate() takes only the stored text', () => {
  Fn.validate('x => x');
  assert.throws(() => Fn.validate('x =>\r\nx'), /canonical value required/);
});

test('function: nesting past src/lib/code.js\'s caps is refused, not left to the stack', () => {
  refuses(Fn, ['x => ' + '!'.repeat(2500) + 'x', 'a => '.repeat(1000) + 'a']);
  accepts(Fn, [['x => ' + '!'.repeat(400) + 'x', 'x => ' + '!'.repeat(400) + 'x']]);
});
