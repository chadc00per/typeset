"""Every type answers each conformance vector exactly as the JavaScript
reference does: the same canonical value (same JSON), the same refusal path and
message, and the same validate() verdict."""
from __future__ import annotations

import importlib.util
import json

import pytest

import chadc00per_typeset as typeset
from chadc00per_typeset._registry import _EXTRAS, _same
from chadc00per_typeset._lib import js
from vectors import catalog, clock, decode, load

# A runtime-specific type's vectors are JavaScript's answers alone (function: test_function.py).
NAMES = [name for name in catalog()['constructors'] if name not in catalog()['runtimeSpecific']]


def wire(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def _installed(module):
    return importlib.util.find_spec(module) is not None


# The types an optional dependency serves: their vectors run when it is installed.
NEEDS = {name: module for name, (module, _extra) in _EXTRAS.items()}


@pytest.mark.parametrize('name', NAMES)
def test_vectors(name, monkeypatch):
    if name in NEEDS and not _installed(NEEDS[name]):
        pytest.skip(f'{NEEDS[name]} is not installed (pip install chadc00per-typeset[all])')
    Type = typeset.get(name)
    # Relative inputs (expiry's "30d") resolve against the spec's clock.
    monkeypatch.setattr(js, 'now', lambda: clock(name))
    failures = []
    for case in load(name):
        value = decode(case['input'])
        shown = json.dumps(case['input'], ensure_ascii=False)[:160]
        try:
            result = Type.check(value)
        except Exception as err:  # a bug, not a refusal
            failures.append(f'{shown}: raised {type(err).__name__}: {err}')
            continue
        if 'output' in case:
            if not result['ok']:
                failures.append(f'{shown}: refused {result["issues"]}, expected {case["output"]!r}')
            elif not _same(result['value'], case['output']) or wire(result['value']) != wire(case['output']):
                failures.append(f'{shown}: gave {wire(result["value"])}, expected {wire(case["output"])}')
        elif result['ok']:
            failures.append(f'{shown}: accepted as {result["value"]!r}, expected {case["issues"]}')
        elif result['issues'] != case['issues']:
            failures.append(f'{shown}: issues {result["issues"]}, expected {case["issues"]}')
        try:
            Type.validate(value)
            stored = True
        except typeset.ValidationError:
            stored = False
        except Exception as err:
            failures.append(f'{shown}: validate raised {type(err).__name__}: {err}')
            continue
        if stored != case['stored']:
            failures.append(f'{shown}: validate {"accepted" if stored else "refused"} it, expected the opposite')
    assert not failures, f'{name}: {len(failures)} of {len(load(name))} vectors differ:\n  ' + '\n  '.join(failures[:25])
