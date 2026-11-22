"""function holds Python source here (js/src/types/function.js holds JavaScript),
so it has no shared conformance vectors; these cases stand in for them. The
trimming, line-ending and refusal rules are the JavaScript ones."""
from __future__ import annotations

import pytest

from chadc00per_typeset import Fn, ValidationError


@pytest.mark.parametrize('given, stored', [
    ('lambda a, b: a + b', 'lambda a, b: a + b'),
    ('  lambda: None\n', 'lambda: None'),
    ('def add(a, b):\n    return a + b', 'def add(a, b):\n    return a + b'),
    ('async def fetch(url):\n    return await get(url)', 'async def fetch(url):\n    return await get(url)'),
    ('@cache\ndef square(x):\n    return x * x', '@cache\ndef square(x):\n    return x * x'),
    ('def f():  # a comment\n    pass', 'def f():  # a comment\n    pass'),
    ('(lambda x: x)', '(lambda x: x)'),
    ('def f():\r\n    return 1\r\n', 'def f():\n    return 1'),
    ('def f():\r    return 1', 'def f():\n    return 1'),
])
def test_one_python_function_kept_as_written(given, stored):
    assert Fn.normalize(given) == stored
    assert Fn.normalize(stored) == stored
    Fn.validate(stored)


@pytest.mark.parametrize('given', [
    '(a, b) => a + b', 'function f() {}', 'x = 1', 'def f(): pass\ndef g(): pass', 'lambda: 1; lambda: 2',
    'f()', 'class A: pass', 'def f(:', 'lambda', '', ' ', 'lambda: 1\x00', 'lambda: ' + '(' * 40000 + '1' + ')' * 40000,
    42, None, {}, ['lambda: 1'], len,
])
def test_anything_but_exactly_one_function_is_refused(given):
    with pytest.raises(ValidationError):
        Fn.normalize(given)


def test_the_refusal_reads_as_in_javascript():
    with pytest.raises(ValidationError, match=r'^handler must be a valid function \(one function\)$'):
        Fn.normalize('f()', 'handler')


def test_the_source_is_parsed_never_run():
    ran = []
    Fn.normalize('def f():\n    ran.append(1)')
    Fn.normalize('lambda: ran.append(1)')
    assert ran == []


def test_validate_takes_only_the_stored_text():
    with pytest.raises(ValidationError, match='canonical value required'):
        Fn.validate('def f():\r\n    return 1')
