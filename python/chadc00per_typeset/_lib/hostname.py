"""DNS name checking shared by domain and hostname."""
from __future__ import annotations

import re

from . import js
from .errors import fail
from .ip import is_ip
from .text import CONTROL_EXCEPT_TAB, text

_URL_LIKE = re.compile(f'{js.S}|[/:@?#%\\\\\\[\\]]')
_DIGITS = re.compile('[0-9]+')
_LABEL = re.compile('[a-z0-9](?:[a-z0-9-]*[a-z0-9])?')


def _domain_to_ascii(text: str) -> str:
    """WHATWG domain-to-ASCII (IDNA), the same algorithm as node:url's domainToASCII; '' when invalid"""
    import ada_url
    try:
        return ada_url.URL(f'http://{js.usv(text)}').hostname
    except ValueError:
        return ''


def hostname(value, path, type, *, labels: int = 1) -> str:
    """A lowercase ASCII DNS name of at least `labels` labels, without a trailing dot."""
    minimum = labels
    raw = text(value, path, type, control=CONTROL_EXCEPT_TAB)
    # Validate syntax before IDNA conversion: domainToASCII also accepts URL-like
    # input and legacy numeric IPv4 spellings, which aren't DNS names here.
    if _URL_LIKE.search(raw):
        return fail(path, type)
    host = _domain_to_ascii(raw).lower()
    if host.endswith('.'):
        host = host[:-1]
    parts = host.split('.')
    if (not host or js.length(host) > 253 or is_ip(host) or _DIGITS.fullmatch(parts[-1]) or len(parts) < minimum
            or not all(js.length(l) <= 63 and _LABEL.fullmatch(l) for l in parts)):
        return fail(path, type)
    return host
