"""semverrange: an npm-style version range: comparators (>=1.2.0 <2), tilde and
caret ranges, hyphen ranges (1.2 - 2) and wildcards, joined by ||. Spacing is
canonical, a leading v and the = operator are dropped, ~> reads as ~, an
empty set means any version (*) and so makes the whole range *, and a
repeated set is kept once."""
from __future__ import annotations

import re

from .._lib import js
from .._lib.errors import fail
from .._lib.text import CONTROL_EXCEPT_TAB, text

# A partial version in a range: 1, 1.2, 1.x, 1.2.3-beta.1; x, X and * are wildcards.
PARTIAL = re.compile(r'v?(0|[1-9][0-9]*|[xX*])(?:\.(0|[1-9][0-9]*|[xX*])(?:\.(0|[1-9][0-9]*|[xX*])(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?)?)?')
# JS `.` stops at line terminators.
COMPARATOR = re.compile('(<=|>=|<|>|=|~>|~|\\^)?([^\n\r  ]+)')
HYPHEN = re.compile(f'({js.NOT_S}+)[ \t]+-[ \t]+({js.NOT_S}+)')


def partial(raw, path, type):
    """One version in a range, with wildcards spelled x and nothing after the first one: "1.X.*" → "1.x"."""
    m = PARTIAL.fullmatch(raw)
    if not m or (m[4] is not None and any(re.fullmatch('0[0-9]+', part) for part in m[4].split('.'))):
        return fail(path, type)
    parts = ['x' if re.fullmatch('[xX*]', p) else p for p in m.groups()[0:3] if p is not None]
    wild = parts.index('x') if 'x' in parts else -1
    if wild != -1 and (m[4] or m[5] or any(p != 'x' for p in parts[wild:])):
        return fail(path, type)
    if wild == 0:
        return '*'
    version = '.'.join(parts if wild == -1 else parts[:wild + 1])
    return version + (f'-{m[4]}' if m[4] else '') + (f'+{m[5]}' if m[5] else '')


def _set(set, path, type):
    set = js.trim(set)
    if not set:
        return '*'
    hyphen = HYPHEN.fullmatch(set)
    if hyphen:
        return f'{partial(hyphen[1], path, type)} - {partial(hyphen[2], path, type)}'
    tokens = []
    for token in re.split('[ \t]+', re.sub('(<=|>=|<|>|=|~>|~|\\^)[ \t]+', r'\1', set)):
        m = COMPARATOR.fullmatch(token)
        if not m:
            return fail(path, type)
        operator = '~' if m[1] == '~>' else '' if m[1] == '=' else m[1] or ''
        tokens.append(operator + partial(m[2], path, type))
    return ' '.join(tokens)


def normalize(value, path, type):
    raw = text(value, path, type, max=1024, control=CONTROL_EXCEPT_TAB, empty=True)
    sets = [_set(s, path, type) for s in raw.split('||')]
    return '*' if '*' in sets else ' || '.join(dict.fromkeys(sets))
