"""Source code as the code types store it (js/src/lib/source.js): text trimmed,
with CRLF and CR line endings as LF. Tabs and line breaks are part of the code;
other control characters are refused."""
from __future__ import annotations

import re

from .text import CONTROL_EXCEPT_WHITESPACE, text

# The longest source a code type reads (function caps lower).
MAX_CODE = 1048576
_LINE_ENDINGS = re.compile(r'\r\n?')


def source(value, path, type, max) -> str:
    return _LINE_ENDINGS.sub('\n', text(value, path, type, max=max, control=CONTROL_EXCEPT_WHITESPACE))
