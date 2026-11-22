"""timecode: an SMPTE timecode HH:MM:SS:FF. A ';' (or '.') before the frames
marks drop-frame, read at 29.97 fps: frames 00..29, and frames 00 and 01 don't
exist at the start of each minute except every tenth. Non-drop allows frames
00..59, the most any SMPTE rate counts; the rate itself isn't stored."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.text import text

TIMECODE = re.compile('([0-9]{2}):([0-5][0-9]):([0-5][0-9])([:;.])([0-9]{2})')


def normalize(value, path, type):
    m = TIMECODE.fullmatch(text(value, path, type, max=256))
    if not m or int(m[1]) > 23:
        return fail(path, type, 'HH:MM:SS:FF')
    drop, minutes, frames = m[4] != ':', int(m[2]), int(m[5])
    if frames > (29 if drop else 59):
        return fail(path, type, 'drop-frame frames 00..29' if drop else 'frames 00..59')
    if drop and m[3] == '00' and minutes % 10 != 0 and frames < 2:
        return fail(path, type, 'dropped frame number')
    return f"{m[1]}:{m[2]}:{m[3]}{';' if drop else ':'}{m[5]}"
