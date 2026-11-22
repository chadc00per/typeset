"""RFC 4648 base64 decoding checks shared by base64 and base64url (js/src/lib/base64.js)."""
from __future__ import annotations

import re

from functools import cache

from .errors import fail
from .text import CONTROL_EXCEPT_WHITESPACE, text

# The line-wrapping whitespace dropped before checking: tab, LF, CR and space.
_WRAPPING = str.maketrans('', '', '\t\n\r ')


@cache
def _grammar(alphabet: str) -> re.Pattern:
    """The alphabet's characters, then at most two '=' (one pattern per alphabet)."""
    return re.compile(f'[{re.escape(alphabet)}]*={{0,2}}')


def unpadded(value, path, type, alphabet):
    """The input without line-wrapping whitespace and padding, checked against
    ``alphabet`` (64 characters) and RFC 4648's padding rules."""
    raw = text(value, path, type, max=16 * 1024 * 1024, control=CONTROL_EXCEPT_WHITESPACE, empty=True).translate(_WRAPPING)
    if not _grammar(alphabet).fullmatch(raw):
        return fail(path, type)
    body = raw.rstrip('=')
    if len(body) % 4 == 1 or ('=' in raw and (len(raw) % 4 != 0 or len(raw) - len(body) != (4 - len(body) % 4) % 4)):
        return fail(path, type)
    # The last character's unused low bits must be zero, or two spellings would decode alike.
    spare = {2: 0x0f, 3: 0x03}.get(len(body) % 4)
    if spare and alphabet.index(body[-1]) & spare:
        return fail(path, type)
    return body
