"""svg: a well-formed XML document whose root is <svg> (js/src/types/svg.js),
checked by the same saxes parse as JavaScript, run in an embedded V8
(lib/code.py). Stored as written, not sanitized: it may hold scripts, so
sanitize it before rendering it."""
from __future__ import annotations

from .._lib.code import parses
from .._lib.errors import fail
from .._lib.source import MAX_CODE, source


def normalize(value, path, type):
    code = source(value, path, type, MAX_CODE)
    return code if parses('svg', code) else fail(path, type, 'well-formed XML with an <svg> root')
