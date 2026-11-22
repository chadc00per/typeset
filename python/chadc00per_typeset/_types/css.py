"""css: a CSS stylesheet or declaration list with no syntax errors
(js/src/types/css.js), checked by the same css-tree parse as JavaScript, run in an
embedded V8 (lib/code.py). Stored as written: trimmed, with CRLF and CR line
endings as LF."""
from __future__ import annotations

from .._lib.code import parses
from .._lib.errors import fail
from .._lib.source import MAX_CODE, source


def normalize(value, path, type):
    code = source(value, path, type, MAX_CODE)
    return code if parses('css', code) else fail(path, type, 'syntax error')
