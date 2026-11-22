"""uri: any absolute URI (mailto:, tel:, urn:, s3://…), RFC 3986 syntax.
Normalized as RFC 3986 section 6.2.2 allows without knowing the scheme:
lowercase scheme and host, percent-encodings normalized, an empty port
dropped, dot segments removed from a path that starts with '/' (a rootless
one, as in urn:, is opaque). Non-ASCII must be percent-encoded; a password in
the userinfo is refused."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.ip import canonical_v6, is_ip
from .._lib.text import CONTROL_EXCEPT_TAB, text

# A scheme, then only unreserved, reserved and percent-encoded characters.
URI = re.compile(r"([A-Za-z][A-Za-z0-9+.-]*):([A-Za-z0-9\-._~!$&'()*+,;=:@/?#\[\]%]+)")  # use fullmatch
UNRESERVED = re.compile(r'[A-Za-z0-9\-._~]')
_PERCENT = re.compile('%([0-9A-Fa-f]{2})')
_BAD_PERCENT = re.compile('%(?![0-9A-Fa-f]{2})')
_AUTHORITY_END = re.compile('[/?#]')
_LITERAL = re.compile(r'\[([^\]]+)\](?::([0-9]*))?')
_NAMED = re.compile(r'([^:\[\]]*)(?::([0-9]*))?')


def _percent_normal(text: str) -> str:
    """Percent-encodings in RFC 3986 normal form: unreserved characters decoded, hex uppercase."""
    def repl(m):
        char = chr(int(m[1], 16))
        return char if UNRESERVED.fullmatch(char) else f'%{m[1].upper()}'
    return _PERCENT.sub(repl, text)


def _remove_dot_segments(path: str) -> str:
    """RFC 3986 section 5.2.4: "." and ".." segments resolved out of an absolute path."""
    out = []
    segments = path.split('/')
    for i in range(1, len(segments)):
        segment, last = segments[i], i == len(segments) - 1
        if segment in ('.', '..'):
            if segment == '..' and out:
                out.pop()
            if last:
                out.append('')
        else:
            out.append(segment)
    return '/' + '/'.join(out)


def normalize(value, path, type):
    m = URI.fullmatch(text(value, path, type, control=CONTROL_EXCEPT_TAB))
    if not m or _BAD_PERCENT.search(m[2]):
        return fail(path, type)
    rest = m[2]
    fragment = rest.find('#')
    if fragment != -1 and '#' in rest[fragment + 1:]:
        return fail(path, type)
    authority, tail = '', rest
    if rest.startswith('//'):
        found = _AUTHORITY_END.search(rest, 2)
        end = -1 if found is None else found.start() - 2
        raw = rest[2:] if end == -1 else rest[2:2 + end]
        tail = '' if end == -1 else rest[2 + end:]
        at = raw.rfind('@')
        userinfo = None if at == -1 else raw[:at]
        if userinfo is not None and re.search(r'[:@\[\]]', userinfo):
            return fail(path, type, 'no password in the URI')
        literal = _LITERAL.fullmatch(raw[at + 1:])
        named = None if literal else _NAMED.fullmatch(raw[at + 1:])
        if literal:
            if is_ip(literal[1]) != 6 or '%' in literal[1]:
                return fail(path, type)
            host, port = f'[{canonical_v6(literal[1])}]', literal[2]
        elif named:
            host, port = _percent_normal(_percent_normal(named[1]).lower()), named[2]
        else:
            return fail(path, type)
        authority = ('//' + ('' if userinfo is None else _percent_normal(userinfo) + '@') + host
                     + (':' + re.sub('^0+(?=[0-9])', '', port) if port else ''))
    if re.search(r'[\[\]]', tail):
        return fail(path, type)
    tail = _percent_normal(tail)
    found = re.search('[?#]', tail)
    split = -1 if found is None else found.start()
    hierarchical = tail if split == -1 else tail[:split]
    if hierarchical.startswith('/'):
        tail = _remove_dot_segments(hierarchical) + ('' if split == -1 else tail[split:])
    # Without an authority, a path that now starts with "//" would read back as
    # one ("foo:/.//evil.com" → "foo://evil.com"); RFC 3986 section 5.3 keeps it a path with "/.".
    if not authority and tail.startswith('//'):
        tail = '/.' + tail
    return f'{m[1].lower()}:{authority}{tail}'
