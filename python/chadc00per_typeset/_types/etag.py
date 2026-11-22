"""etag: an HTTP entity tag, strong or weak. The opaque payload is
case-sensitive: RFC 9110 opaque-tag characters, a backslash literal rather
than an escape, and no quotes or spaces."""
from __future__ import annotations

import re

from .._lib import js
from .._lib.errors import fail
from .._lib.text import MAX_INPUT, text

# The opaque payload is capped at MAX_INPUT, inside W/"…".
MAX_ETAG = MAX_INPUT + len('W/""')
_NOT_OPAQUE = re.compile('[^\x21\x23-\x7e\x80-\xff]')


def normalize(value, path, type):
    raw = text(value, path, type, max=MAX_ETAG, control=None)
    weak = ''
    if raw[:2] in ('w/', 'W/'):
        weak = 'W/'
        raw = raw[2:]
        if not raw.startswith('"'):
            return fail(path, type)
    if raw.startswith('"'):
        if not raw.endswith('"') or js.length(raw) < 2:
            return fail(path, type)
        raw = raw[1:-1]
    if js.length(raw) > MAX_INPUT or _NOT_OPAQUE.search(raw):
        return fail(path, type)
    return f'{weak}"{raw}"'
