"""html: an HTML fragment with none of the HTML standard's parse errors
(js/src/types/html.js), checked by the same parse5 parse as JavaScript, run in an
embedded V8 (lib/code.py). Stored as written, not sanitized: it may hold
scripts, so sanitize it before rendering it."""
from __future__ import annotations

from .._lib.code import parses
from .._lib.errors import fail
from .._lib.source import MAX_CODE, source


def normalize(value, path, type):
    code = source(value, path, type, MAX_CODE)
    return code if parses('html', code) else fail(path, type, 'syntax error')
