"""contenttype: a media type with its parameters, which are sorted by name with
lowercase names and charset values."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.media import media_type

TOKEN = re.compile(r"[!#$%&'*+.^_`|~0-9A-Za-z-]+")  # use fullmatch
# Sticky parsing rejects malformed/duplicate parameters instead of silently
# discarding them. Quoted semicolons and escaped quotes remain data. An empty
# parameter ("text/plain;", "a/b;;c=d") is allowed by RFC 9110 and dropped.
PARAM = re.compile(r"""[ \t]*;[ \t]*(?:([!#$%&'*+.^_`|~0-9A-Za-z-]+)=([!#$%&'*+.^_`|~0-9A-Za-z-]+|"(?:[\t !#-\[\]-~\x80-\xff]|\\[\t -~\x80-\xff])*")[ \t]*)?""")


def normalize(value, path, type):
    media = media_type(value, path, type)
    base, rest = media['base'], media['rest']
    params = {}
    offset = 0
    while offset < len(rest):
        match = PARAM.match(rest, offset)  # sticky: anchored at offset
        if not match:
            return fail(path, type)
        offset = match.end()
        if match[1] is None:
            continue
        key = match[1].lower()
        if key in params:
            return fail(path, type)
        value = match[2]
        if value.startswith('"'):
            value = re.sub(r'\\(.)', r'\1', value[1:-1])
        if key == 'charset':
            value = value.lower()
        params[key] = value if TOKEN.fullmatch(value) else '"' + re.sub(r'["\\]', lambda m: '\\' + m[0], value) + '"'
    return base + ''.join(f'; {k}={v}' for k, v in sorted(params.items(), key=lambda kv: kv[0]))
