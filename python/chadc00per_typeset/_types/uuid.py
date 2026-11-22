"""uuid: any UUID (every version and variant), lowercase and hyphenated; braces,
urn:uuid: and the unhyphenated 32-digit form are accepted."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.text import ascii_lower, text

UUID = re.compile(r'[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')


def normalize(value, path, type):
    raw = re.sub('^urn:uuid:', '', ascii_lower(text(value, path, type, max=64)))
    if raw.startswith('{') and raw.endswith('}'):
        raw = raw[1:-1]
    if not UUID.fullmatch(raw):
        return fail(path, type)
    hex = raw.replace('-', '')
    return f'{hex[:8]}-{hex[8:12]}-{hex[12:16]}-{hex[16:20]}-{hex[20:]}'
