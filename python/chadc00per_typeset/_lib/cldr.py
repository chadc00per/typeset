"""The pinned CLDR validity tables (data/geography.json), shared by language,
country, region and locale."""
from __future__ import annotations

from .. import _data

_sets: dict = {}


def contains(kind: str, value: str) -> bool:
    """Whether ``value`` is in CLDR table ``kind``. CLDR stores consecutive final
    characters as ranges (e.g. US subdivisions); only the requested table is
    expanded, and only on the first value needing it."""
    if kind not in _sets:
        codes = []
        for token in _data.load('geography.json')[kind].split(' '):
            start, _, end = token.partition('~')
            if not end:
                codes.append(start)
            else:
                prefix = start[:-1]
                codes.extend(prefix + chr(c) for c in range(ord(start[-1]), ord(end[0]) + 1))
        _sets[kind] = frozenset(codes)
    return value in _sets[kind]
