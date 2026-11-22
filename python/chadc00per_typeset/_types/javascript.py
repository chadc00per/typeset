"""javascript: JavaScript source, a script or a module (js/src/types/javascript.js),
checked by the same acorn parse as JavaScript, run in an embedded V8
(lib/code.py). Stored as written: trimmed, with CRLF and CR line endings as
LF. Parsed, never run."""
from __future__ import annotations

from .._lib.code import parses
from .._lib.errors import fail
from .._lib.source import MAX_CODE, source


def normalize(value, path, type):
    code = source(value, path, type, MAX_CODE)
    return code if parses('javascript', code) else fail(path, type, 'syntax error')
