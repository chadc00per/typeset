"""font: a CSS font-family list with lowercase family names, quoted unless
generic. A deliberately bounded grammar: letters, digits, spaces, hyphens and
underscores; no CSS escapes, functions, declarations or remote URLs."""
from __future__ import annotations

import re
import unicodedata

from .._lib import js
from .._lib.errors import fail
from .._lib.text import CONTROL_EXCEPT_WHITESPACE, text

GENERIC_FAMILIES = {'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'emoji', 'math', 'fangsong'}
RESERVED_FAMILIES = {'inherit', 'initial', 'unset', 'revert', 'revert-layer', 'default'}


def _family(name: str) -> bool:
    """/^[\\p{L}\\p{N} _-]+$/u"""
    return bool(name) and all(c in ' _-' or unicodedata.category(c)[0] in 'LN' for c in name)


def _entry(entry, path, type):
    name = js.trim(entry)
    if name[:1] in ('"', "'"):
        if name[-1] != name[0]:
            return fail(path, type)
        name = name[1:-1]
        if name.lower() in GENERIC_FAMILIES:
            return fail(path, type)
    name = unicodedata.normalize('NFC', re.sub(js.S + '+', ' ', js.trim(name)).lower())
    if not name or js.length(name) > 128 or not _family(name) or name in RESERVED_FAMILIES:
        return fail(path, type)
    if name in GENERIC_FAMILIES:
        return name
    return f'"{name}"'


def normalize(value, path, type):
    raw = text(value, path, type, max=1024, control=CONTROL_EXCEPT_WHITESPACE, empty=True)
    entries = raw.split(',')
    if len(entries) > 16:
        return fail(path, type)
    return ', '.join(_entry(entry, path, type) for entry in entries)
