"""time: a wall-clock time HH:mm:ss.SSS with no time zone; seconds and
milliseconds are filled in when left out."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.text import text

TIME = re.compile(r'([0-9]{2}):([0-9]{2})(?::([0-9]{2})(?:\.([0-9]{1,3}))?)?')


def normalize(value, path, type):
    match = TIME.fullmatch(text(value, path, type, max=256))
    if not match or int(match[1]) > 23 or int(match[2]) > 59 or int(match[3] or 0) > 59:
        return fail(path, type, 'HH:mm[:ss[.SSS]], no timezone')
    return f"{match[1]}:{match[2]}:{match[3] or '00'}.{(match[4] or '').ljust(3, '0')}"
