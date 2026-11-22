"""emoji: exactly one Unicode 17 emoji, stored fully qualified (data/emoji.json)."""
from __future__ import annotations

from .. import _data
from .._lib.errors import fail
from .._lib.text import CONTROL_EXCEPT_WHITESPACE, text

_emojis = None


def normalize(value, path, type):
    global _emojis
    raw = text(value, path, type, max=128, control=CONTROL_EXCEPT_WHITESPACE, empty=True)
    if _emojis is None:
        _emojis = dict(_data.load('emoji.json')['entries'])
    result = _emojis.get(raw)
    return fail(path, type) if result is None else result
