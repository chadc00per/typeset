"""python: Python 3 source (js/src/types/python.js), checked by Lezer's Python
grammar run in an embedded V8 (lib/code.py), the same parser as the
JavaScript package, so both accept exactly the same sources. That grammar is
a little looser than CPython's own (see js/src/lib/code.js). Stored as written:
trimmed, with CRLF and CR line endings as LF. Parsed, never run."""
from __future__ import annotations

from .._lib.code import parses
from .._lib.errors import fail
from .._lib.source import MAX_CODE, source


def normalize(value, path, type):
    code = source(value, path, type, MAX_CODE)
    return code if parses('python', code) else fail(path, type, 'syntax error')
