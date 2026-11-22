// javascript: JavaScript source, a script or module, syntax-checked by parsing; never run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { JavaScript } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('javascript: a script or a module, kept as written', () => {
  accepts(JavaScript, [
    ["const greeting = 'hello';", "const greeting = 'hello';"],
    ['  let x = 1\n', 'let x = 1'],
    ["import x from 'y';\nexport default x;", "import x from 'y';\nexport default x;"],
    ['await fetch(url)', 'await fetch(url)'],
    ['with (o) { x }', 'with (o) { x }'],
    ['class A { #p = 1; get p() { return this.#p; } }', 'class A { #p = 1; get p() { return this.#p; } }'],
    ['a ?? b?.c', 'a ?? b?.c'],
    ['/* only a comment */', '/* only a comment */'],
    ['x = 08', 'x = 08'],
    ['if (a) {\r\n  b();\r\n}', 'if (a) {\n  b();\n}']
  ]);
});

test('javascript: a syntax error is refused', () => {
  refuses(JavaScript, ['function (', 'let let = 1', 'a => {', "'use strict'; x = 08", 'return 1', 'x = )', '', ' ', 42, null, {},
    'x\u0000', `x = ${'['.repeat(300)}${']'.repeat(300)}`]);
  assert.throws(() => JavaScript.normalize('a => {', 'script'), { message: 'script must be a valid JavaScript source (syntax error)' });
});

test('javascript: the source is parsed, never run', () => {
  globalThis.typesetRan = false;
  JavaScript.normalize('globalThis.typesetRan = true;');
  assert.equal(globalThis.typesetRan, false);
  delete globalThis.typesetRan;
});

// Nesting is capped (src/lib/code.js), not left to the parser's stack, so the answer
// never depends on the engine: bracket-free chains recurse in acorn too.
const DEEP = ['!'.repeat(2500) + 'x', 'a => '.repeat(1000) + 'a', 'a ? b : '.repeat(1000) + 'c', 'new '.repeat(1000) + 'X',
  'typeof '.repeat(1000) + 'x', '1' + ' + 1'.repeat(1000), 'if (a) '.repeat(1000) + 'b;', `${'('.repeat(129)}1${')'.repeat(129)}`];
const SHALLOW = ['!'.repeat(400) + 'x', 'a => '.repeat(100) + 'a', '1' + ' + 1'.repeat(400), `${'('.repeat(128)}1${')'.repeat(128)}`];

test('javascript: nesting past the caps is refused, whatever the stack', () => {
  refuses(JavaScript, DEEP);
  accepts(JavaScript, SHALLOW.map(s => [s, s]));
  const script = `import('${new URL('../../src/index.js', import.meta.url)}').then(({ JavaScript }) =>
    console.log(JSON.stringify(${JSON.stringify([...DEEP, ...SHALLOW])}.map(s => JavaScript.is(s)))))`;
  const small = JSON.parse(execFileSync(process.execPath, ['--stack-size=450', '--input-type=module', '-e', script], { encoding: 'utf8' }));
  assert.deepEqual(small, [...DEEP.map(() => false), ...SHALLOW.map(() => true)]);
});
