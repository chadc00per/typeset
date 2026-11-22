// python: Python 3 source, syntax-checked by parsing; never run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Python } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('python: Python 3 source, kept as written', () => {
  accepts(Python, [
    ["print('hello')", "print('hello')"],
    ['def add(a, b):\n    return a + b', 'def add(a, b):\n    return a + b'],
    ['x = 1\ny = 2\n', 'x = 1\ny = 2'],
    ['match x:\n    case 1:\n        pass', 'match x:\n    case 1:\n        pass'],
    ["f'{a!r:>10}'", "f'{a!r:>10}'"],
    ['async def g():\n    await h()', 'async def g():\n    await h()'],
    ['(y := 1)', '(y := 1)'],
    ['x = 0o777', 'x = 0o777'],
    ['raise E from v', 'raise E from v'],
    ['if x:\r\n    pass', 'if x:\n    pass']
  ]);
});

test('python: a syntax error or a Python 2 form is refused', () => {
  refuses(Python, ['def f(:\n    pass', 'if x:\npass', 'x = (1,', 'x := 1', 'a = = b', 'x y',
    "print 'hi'", 'raise E, v', 'x = 0777', 'a <> b', 'exec "x"', '', ' ', 42, null]);
  assert.throws(() => Python.normalize('x y', 'script'), { message: 'script must be a valid Python source (syntax error)' });
});
