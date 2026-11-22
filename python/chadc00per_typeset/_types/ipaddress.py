"""ipaddress: an IPv4 or IPv6 address alone, canonical; no port or zone."""
from __future__ import annotations

from .._lib.errors import fail
from .._lib.ip import address
from .._lib.text import CONTROL_EXCEPT_TAB, text


def normalize(value, path, type):
    return address(text(value, path, type, control=CONTROL_EXCEPT_TAB)) or fail(path, type, 'address without a port')
