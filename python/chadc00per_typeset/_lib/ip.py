"""IP address grammar shared by ip, ipaddress, iprange and uri: node:net's isIP
grammar, so addresses read the same in a browser as in Node.
From Node.js lib/internal/net.js (MIT, © Node.js contributors); see THIRD-PARTY-NOTICES.md."""
from __future__ import annotations

import re

V4_SEG = '(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])'
V4 = f'(?:{V4_SEG}\\.){{3}}{V4_SEG}'
V6_SEG = '[0-9a-fA-F]{1,4}'
IPV4 = re.compile(V4)  # use fullmatch
IPV6 = re.compile('(?:'
                  f'(?:{V6_SEG}:){{7}}(?:{V6_SEG}|:)|'
                  f'(?:{V6_SEG}:){{6}}(?:{V4}|:{V6_SEG}|:)|'
                  f'(?:{V6_SEG}:){{5}}(?::{V4}|(?::{V6_SEG}){{1,2}}|:)|'
                  f'(?:{V6_SEG}:){{4}}(?:(?::{V6_SEG}){{0,1}}:{V4}|(?::{V6_SEG}){{1,3}}|:)|'
                  f'(?:{V6_SEG}:){{3}}(?:(?::{V6_SEG}){{0,2}}:{V4}|(?::{V6_SEG}){{1,4}}|:)|'
                  f'(?:{V6_SEG}:){{2}}(?:(?::{V6_SEG}){{0,3}}:{V4}|(?::{V6_SEG}){{1,5}}|:)|'
                  f'(?:{V6_SEG}:){{1}}(?:(?::{V6_SEG}){{0,4}}:{V4}|(?::{V6_SEG}){{1,6}}|:)|'
                  f'(?::(?:(?::{V6_SEG}){{0,5}}:{V4}|(?::{V6_SEG}){{1,7}}|:))'
                  ')(?:%[0-9a-zA-Z.:-]{1,})?')  # use fullmatch


def is_ip(text: str) -> int:
    """4 or 6 for an IPv4 or IPv6 address (a zone id allowed), 0 otherwise."""
    return 4 if IPV4.fullmatch(text) else 6 if IPV6.fullmatch(text) else 0


def canonical_v6(address: str) -> str:
    """An IPv6 address in the WHATWG URL serialization: lowercase, zeros compressed, IPv4 tail as hex."""
    import ada_url
    return ada_url.URL(f'http://[{address}]/').hostname[1:-1]


def address(raw: str) -> str:
    """A bare address, no port or zone, canonical: '' when it isn't one."""
    version = is_ip(raw)
    if not version or '%' in raw:
        return ''
    return canonical_v6(raw) if version == 6 else raw
