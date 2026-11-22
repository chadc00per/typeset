"""Labels shared by tag, tagset and scopes (js/src/lib/tags.js): one tag, and the
list input tagset and scopes read."""
from __future__ import annotations

import re
import unicodedata

from . import js
from .errors import fail
from .text import text

MAX_TAGS = 256
# The longest comma-separated list read: MAX_TAGS items of a tag's longest raw input, and their commas.
MAX_LIST_INPUT = MAX_TAGS * 1025

_PUNCTUATION = " ._&+'/#-"


def _label(raw: str) -> bool:
    """/^[\\p{L}\\p{N}][\\p{L}\\p{M}\\p{N} ._&+'/#-]*$/u"""
    if unicodedata.category(raw[0])[0] not in 'LN':
        return False
    return all(c in _PUNCTUATION or unicodedata.category(c)[0] in 'LMN' for c in raw[1:])


def tag(value, path, type='tag'):
    """One label: lowercase, then NFC (lowercasing can undo NFC), whitespace collapsed, an optional leading '#'
    dropped. Commas separate tags in list input, so a tag never holds one."""
    raw = text(value, path, type, max=1024, empty=True)
    raw = unicodedata.normalize('NFC', re.sub('^#', '', raw).lower())
    raw = js.trim(re.sub(js.S + '+', ' ', raw))
    if not raw or js.length(raw) > 64 or not _label(raw):
        return fail(path, type)
    return raw


def list(value, path, type):
    """An array, or comma-separated text, of at most MAX_TAGS items."""
    if isinstance(value, str) and js.length(value) > MAX_LIST_INPUT:
        return fail(path, type, f'an array of at most {MAX_TAGS}')
    items = value.split(',') if isinstance(value, str) and js.trim(value) else value
    if not js.is_array(items) or len(items) > MAX_TAGS:
        return fail(path, type, f'an array of at most {MAX_TAGS}')
    return [*items]
