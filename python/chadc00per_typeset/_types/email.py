"""email: an email address, lowercased, trimmed and NFC, its domain stored as
the WHATWG host parser reads it, in Unicode. A stored value is
the output of this, so its behavior is part of the data format: change it and
existing values stop comparing equal to new writes.
The address rule is the one Joi's string().email() applies: RFC 5321
dot-atoms (RFC 6531 UTF-8 allowed), an IANA top-level domain, no quoted parts
or address literals. The TLD list is @hapi/tlds', pinned in data/tlds.json.
Ported from @hapi/address 5 (BSD-3-Clause, © 2019-2022
Sideway, Inc. and Project contributors) at its default options, minus its
node:url / node:util imports so a browser runs it. Full notice: THIRD-PARTY-NOTICES.md."""
from __future__ import annotations

import re
import unicodedata

from .. import _data
from .._lib import js
from .._lib.errors import fail

ATEXT = re.compile(r"[A-Za-z0-9_!#$%&'*+\-/=?^`{|}~]+")  # use fullmatch
UTF8_ATOM = re.compile('(?:[\xc2-\xdf][\x80-\xbf])|(?:\xe0[\xa0-\xbf][\x80-\xbf])|(?:[\xe1-\xec][\x80-\xbf]{2})|(?:\xed[\x80-\x9f][\x80-\xbf])|(?:[\xee-\xef][\x80-\xbf]{2})|(?:\xf0[\x90-\xbf][\x80-\xbf]{2})|(?:[\xf1-\xf3][\x80-\xbf]{3})|(?:\xf4[\x80-\x8f][\x80-\xbf]{2})')
# What a local part may not hold though UTF8_ATOM's byte ranges allow it: C1
# controls, spaces, format characters (zero-width, bidi overrides, the BOM)
# and private use. Unicode 17's Cc, Cf, Co and Z, written out rather than read
# from unicodedata so every Python's Unicode version agrees with JS.
INVISIBLE = re.compile('[\x80-\xa0\xad\u0600-\u0605\u061c\u06dd\u070f\u0890-\u0891\u08e2\u1680\u180e\u2000-\u200f\u2028-\u202f\u205f-\u2064\u2066-\u206f\u3000\ue000-\uf8ff\ufeff\ufff9-\ufffb\U000110bd\U000110cd\U00013430-\U0001343f\U0001bca0-\U0001bca3\U0001d173-\U0001d17a\U000e0001\U000e0020-\U000e007f\U000f0000-\U000ffffd\U00100000-\U0010fffd]')
DOMAIN_CONTROL = re.compile(r"[\x00-\x20@:/\\#!$&'()*+,;=?]")
LABEL = re.compile('[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?')
TLD = re.compile('[a-zA-Z](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?')
_NON_ASCII = re.compile('[^\x00-\x7f]')
# The longest raw input read: an address is at most 128 characters once trimmed.
MAX_INPUT = 1024
_tlds = None


def _top_level_domains():
    """The IANA top-level domains (data/tlds.json), read into a set on the first address."""
    global _tlds
    if _tlds is None:
        _tlds = set(_data.load('tlds.json')['tlds'].split(' '))
    return _tlds


def _utf8(text: str) -> bytes:
    """TextEncoder.encode: lone surrogates encode as U+FFFD."""
    return js.usv(text).encode('utf-8')


def _code_points(text: str):
    """[...text]: code points, a surrogate pair (if Python holds one split) joined."""
    return list(text.encode('utf-16-be', 'surrogatepass').decode('utf-16-be', 'surrogatepass'))


def _punycode(label: str):
    """RFC 3492 Punycode decoding (the part after "xn--"); None when malformed."""
    try:
        return label.encode('ascii').decode('punycode')
    except (UnicodeError, ValueError):
        return None


def _canonical_address(address: str):
    """The address as stored, or None: the local part as written, the domain as
    the WHATWG host parser maps it (see _canonical_domain)."""
    ascii = not _NON_ASCII.search(address)
    if not ascii:
        address = unicodedata.normalize('NFC', address)
    if not js.well_formed(address):
        return None
    parts = address.split('@')
    if len(parts) != 2 or not parts[0] or js.length(address) > 254 or len(_utf8(parts[0])) > 64:
        return None
    if not ascii and INVISIBLE.search(parts[0]):
        return None
    local = all(segment and (ATEXT.fullmatch(segment) if ascii else all(
        ATEXT.fullmatch(char) or UTF8_ATOM.search(_utf8(char).decode('latin-1')) for char in _code_points(segment)))
        for segment in parts[0].split('.'))
    domain = _canonical_domain(parts[1]) if local else None
    return None if domain is None else f'{parts[0]}@{domain}'


def _canonical_domain(domain: str):
    """The domain in Unicode, as the WHATWG host parser reads it, or None. The
    parser maps fullwidth letters, '\u3002', '\u017f' and ignorable characters such
    as the soft hyphen, and a label typed in Punycode is decoded, so each domain
    has one spelling."""
    if not domain or js.length(domain) > 256:
        return None
    if _NON_ASCII.search(domain):
        domain = unicodedata.normalize('NFC', domain)
    if DOMAIN_CONTROL.search(domain):
        return None
    import ada_url
    try:
        domain = ada_url.URL('http://' + js.usv(domain.replace('%', '%25'))).host
    except ValueError:
        pass  # checked as written
    labels = domain.split('.')
    if len(labels) < 2 or labels[-1].lower() not in _top_level_domains():
        return None
    if not all(label and js.length(label) <= 63 and (LABEL if i < len(labels) - 1 else TLD).fullmatch(label)
               for i, label in enumerate(labels)):
        return None
    unicode = [_punycode(label[4:].lower()) if label[:4].lower() == 'xn--' else label.lower() for label in labels]
    return None if None in unicode else '.'.join(unicode)


# Lowercased, trimmed and NFC, with the domain as _canonical_domain() reads it,
# so one address never stores as two spellings.
def normalize(value, path, type):
    if not isinstance(value, str) or js.length(value) > MAX_INPUT:
        return fail(path, type)
    cleaned = unicodedata.normalize('NFC', js.trim(value.lower()))
    address = None if js.length(cleaned) < 6 or js.length(cleaned) > 128 else _canonical_address(cleaned)
    if address is None or js.length(address) < 6 or js.length(address) > 128:
        return fail(path, type)
    return address
