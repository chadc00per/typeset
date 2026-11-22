"""The README's Python examples and TYPES.md's samples, run, so the docs can't drift
from the code (js/tests/readme.test.js does the same for the JavaScript side).

    ```python blocks in README.md and python/README.md run in a fresh namespace. A line
    ending in `# → value` checks the expression before it equals `value`;
    `# → raises Name: message` checks it raises that error.
    TYPES.md: each row's `input` → `stored` sample is normalize()'s answer."""
from __future__ import annotations

import ast
import importlib.util
import json
import re

import pytest

import chadc00per_typeset as typeset
from chadc00per_typeset._registry import _EXTRAS
from vectors import ROOT, installed

ARROW = re.compile(r'^(\s*)(.+?)\s*# → (.+)$')


def blocks(markdown, language):
    """Each fenced block of a language: (code, first line)."""
    out, lines, i = [], markdown.split('\n'), 0
    while i < len(lines):
        if lines[i] == f'```{language}':
            start = i + 1
            i += 1
            while lines[i] != '```':
                i += 1
            out.append(('\n'.join(lines[start:i]), start + 1))
        i += 1
    return out


def runnable(code, first):
    out = []
    for offset, text in enumerate(code.split('\n')):
        arrow = ARROW.match(text)
        if not arrow:
            out.append(text)
            continue
        indent, expression, expected = arrow.groups()
        raised = re.match(r'raises (\w+): (.+)$', expected)
        if raised:
            out.append(f'{indent}__raises(lambda: ({expression}), {raised[1]!r}, {raised[2]!r}, {first + offset})')
        else:
            out.append(f'{indent}__check(lambda: ({expression}), lambda: ({expected}), {first + offset})')
    return '\n'.join(out)


def _check(actual, expected, line):
    assert actual() == expected(), f'line {line}'


def _raises(call, name, message, line):
    with pytest.raises(Exception) as err:  # any class: the name is checked below
        call()
    assert type(err.value).__name__ == name and str(err.value) == message, f'line {line}: {err.value!r}'


def examples():
    for file in ('README.md', 'python/README.md'):
        for code, line in blocks((ROOT / file).read_text(encoding='utf-8'), 'python'):
            yield pytest.param(code, line, id=f'{file}:{line}')


@pytest.mark.parametrize(('code', 'line'), list(examples()))
def test_readme_python_examples(code, line):
    if 'pydantic' in code and importlib.util.find_spec('pydantic') is None:
        pytest.skip('pydantic is not installed')
    missing = [name for name in _EXTRAS if not installed(name) and re.search(rf'\b{typeset.get(name).__name__}\b', code)]
    if missing:
        pytest.skip(f'{", ".join(missing)} need an optional dependency')
    # dont_inherit: the example's annotations stay real (this module's `annotations` future would make them strings).
    exec(compile(runnable(code, line), f'README:{line}', 'exec', dont_inherit=True),
         {'__name__': 'readme', '__check': _check, '__raises': _raises})


def test_every_python_block_checks_something():
    arrows = sum(code.count('# → ') for file in ('README.md', 'python/README.md')
                 for code, _ in blocks((ROOT / file).read_text(encoding='utf-8'), 'python'))
    assert arrows >= 10


def _literal(js):
    """A sample, written as a JavaScript literal, as Python data: unquoted object keys
    quoted and true/false/null spelled as Python's, outside string literals only."""
    if js.startswith('JSON.parse('):
        return json.loads(_literal(js[len('JSON.parse('):-1]))
    out, i = [], 0
    while i < len(js):
        if js[i] in '\'"':
            end = i + 1
            while js[end] != js[i]:
                end += 2 if js[end] == '\\' else 1
            out.append(js[i:end + 1])
            i = end + 1
            continue
        word = re.match(r'[A-Za-z_]\w*', js[i:])
        if word:
            text = word[0]
            after = js[i + len(text):].lstrip()
            out.append(repr(text) if after.startswith(':') else {'true': 'True', 'false': 'False', 'null': 'None'}.get(text, text))
            i += len(text)
            continue
        out.append(js[i])
        i += 1
    return ast.literal_eval(''.join(out))


def samples():
    markdown = (ROOT / 'TYPES.md').read_text(encoding='utf-8')
    for row in (line for line in markdown.split('\n') if re.match(r'^\| `[A-Z]', line)):
        cells = [c.strip().replace('\\|', '|') for c in re.split(r'(?<!\\)\|', row[1:-1])]
        name = re.search(r'`(\w+)`', cells[1])[1]
        if name == 'function':  # holds each language's own source; tested in test_function.py
            continue
        for pair in re.split(r'(?<=`), (?=`)', cells[3]):
            m = re.match(r'^`(.+)` → (?:`(.+)`|(same|unchanged|the object))(.*)$', pair)
            if not m or m[4]:
                continue
            stored = m[2] or (f'JSON.parse({m[1]})' if m[3] == 'the object' else m[1])
            yield name, m[1], stored


def test_types_md_samples_normalize_to_their_stored_value():
    rows = list(samples())
    assert len(rows) >= 95
    for name, given, stored in rows:
        Type = typeset.get(name)
        if Type._typeset_extra and importlib.util.find_spec({'phone': 'phonenumbers'}.get(name, 'py_mini_racer')) is None:
            continue
        assert Type.normalize(_literal(given)) == _literal(stored), f'{name}: {given}'
