"""iprange: a CIDR block, its network address and prefix length. A bare
address is a one-address block (/32 or /128). Host bits must be zero rather
than being masked off, so "10.0.0.5/8" is refused instead of silently
becoming 10.0.0.0/8."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.ip import address, canonical_v6
from .._lib.text import CONTROL_EXCEPT_TAB, text

_CIDR = re.compile(r'([^/]+)(?:/(0|[1-9][0-9]{0,2}))?')


def _to_bits(canonical: str) -> int:
    """An address as an integer of its 32 or 128 bits, and back."""
    if ':' not in canonical:
        n = 0
        for octet in canonical.split('.'):
            n = (n << 8) | int(octet)
        return n
    head, sep, tail = canonical.partition('::')
    left = head.split(':') if head else []
    right = tail.split(':') if tail else []
    groups = left if not sep else [*left, *['0'] * (8 - len(left) - len(right)), *right]
    n = 0
    for group in groups:
        n = (n << 16) | int(group, 16)
    return n


def _from_bits(n: int, version: int) -> str:
    if version == 4:
        return '.'.join(str((n >> shift) & 255) for shift in (24, 16, 8, 0))
    return canonical_v6(':'.join(format((n >> (112 - 16 * i)) & 0xffff, 'x') for i in range(8)))


def normalize(value, path, type):
    m = _CIDR.fullmatch(text(value, path, type, control=CONTROL_EXCEPT_TAB))
    canonical = m and address(m[1])
    if not canonical:
        return fail(path, type, 'CIDR block such as 10.0.0.0/8')
    version = 6 if ':' in canonical else 4
    bits = 32 if version == 4 else 128
    prefix = bits if m[2] is None else int(m[2])
    if prefix > bits:
        return fail(path, type, f'prefix 0..{bits}')
    n = _to_bits(canonical)
    if n & ((1 << (bits - prefix)) - 1):
        return fail(path, type, 'host bits must be zero')
    return f'{_from_bits(n, version)}/{prefix}'
