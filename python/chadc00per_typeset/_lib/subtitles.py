"""Subtitle timestamps shared by vtt, srt, vttrange and srtrange. They are
offsets, not dates or times of day; arithmetic stays exact in integer
milliseconds, including hours beyond a 24-hour clock."""
from __future__ import annotations

import re

from . import js
from .errors import fail
from .text import CONTROL_EXCEPT_TAB, text

TIMESTAMPS = {
    'vtt': re.compile(r'(?:([0-9]{2,}):)?([0-5][0-9]):([0-5][0-9])\.([0-9]{3})'),
    'srt': re.compile(r'([0-9]{2,}):([0-5][0-9]):([0-5][0-9]),([0-9]{3})'),
}
_ARROW = re.compile('[ \t]*-->[ \t]*')


# Tab is whitespace in subtitle cue timings.
def _input(value, path, type):
    return text(value, path, type, max=256, control=CONTROL_EXCEPT_TAB, empty=True)


# One timestamp in `format` ('vtt' or 'srt'): its milliseconds and canonical text.
def _timestamp(raw, path, type, format):
    m = TIMESTAMPS[format].fullmatch(raw)
    if not m:
        return fail(path, type)
    hours = int(m[1] or 0)
    ms = hours * 3600000 + int(m[2]) * 60000 + int(m[3]) * 1000 + int(m[4])
    if not js.is_safe_integer(ms):
        return fail(path, type)
    return {'ms': ms, 'text': f"{str(hours).rjust(2, '0')}:{m[2]}:{m[3]}{'.' if format == 'vtt' else ','}{m[4]}"}


def cue(value, path, type, format):
    return _timestamp(_input(value, path, type), path, type, format)['text']


# Cue timing "start --> end" with strictly increasing endpoints. An endpoint
# is refused as its timestamp type (vtt or srt).
def cue_range(value, path, type, format):
    parts = _ARROW.split(_input(value, path, type))
    if len(parts) != 2:
        return fail(path, type)
    start, end = _timestamp(parts[0], path, format, format), _timestamp(parts[1], path, format, format)
    if end['ms'] <= start['ms']:
        return fail(path, type)
    return f"{start['text']} --> {end['text']}"
