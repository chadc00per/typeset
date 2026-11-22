"""url: an absolute http or https URL, serialized by the WHATWG URL parser.
Credentials in the URL are refused."""
from __future__ import annotations

import re

from .._lib import js
from .._lib.errors import fail
from .._lib.text import CONTROL_EXCEPT_TAB, text

_HTTP = re.compile(r'https?://[^/?#]', re.I | re.A)
_SPACE_OR_BACKSLASH = re.compile(f'{js.S}|\\\\')
_BAD_PERCENT = re.compile('%(?![0-9a-fA-F]{2})')


def normalize(value, path, type):
    raw = text(value, path, type, control=CONTROL_EXCEPT_TAB)
    if not _HTTP.match(raw) or _SPACE_OR_BACKSLASH.search(raw) or _BAD_PERCENT.search(raw):
        return fail(path, type)
    import ada_url
    try:
        parsed = ada_url.URL(js.usv(raw))
    except ValueError:
        return fail(path, type)
    if not parsed.hostname or parsed.username or parsed.password:
        return fail(path, type)
    return parsed.href
