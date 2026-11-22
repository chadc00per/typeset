"""ip: an IPv4 or IPv6 address, optionally with a port 1–65535; an IPv6
address with a port is bracketed. Zone ids are refused: a scoped address
depends on local interfaces, so it isn't a portable IP."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.ip import canonical_v6, is_ip
from .._lib.text import CONTROL_EXCEPT_TAB, text

_BRACKETED = re.compile(r'\[([^\]]+)\](?::([0-9]+))?')
_WITH_PORT = re.compile(r'([^:]+):([0-9]+)')


def normalize(value, path, type):
    raw = text(value, path, type, control=CONTROL_EXCEPT_TAB)
    address, port = raw, None
    if raw.startswith('['):
        match = _BRACKETED.fullmatch(raw)
        if not match or is_ip(match[1]) != 6:
            return fail(path, type)
        address, port = match[1], match[2]
    elif not is_ip(raw):
        match = _WITH_PORT.fullmatch(raw)
        if not match or is_ip(match[1]) != 4:
            return fail(path, type)
        address, port = match[1], match[2]
    version = is_ip(address)
    if not version or '%' in address or (port is not None and (len(port) > 5 or int(port) < 1 or int(port) > 65535)):
        return fail(path, type)
    canonical = canonical_v6(address) if version == 6 else address
    if port is not None:
        return f'{f"[{canonical}]" if version == 6 else canonical}:{int(port)}'
    return canonical
