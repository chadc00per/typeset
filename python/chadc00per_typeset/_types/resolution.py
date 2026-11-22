"""resolution: positive pixel dimensions WIDTHxHEIGHT, from text or a [width, height] pair."""
from __future__ import annotations

import re

from .._lib import js
from .._lib.errors import fail
from .._lib.text import text

RESOLUTION = re.compile(f'([0-9]+){js.S}*[xX×]{js.S}*([0-9]+)')


def normalize(value, path, type):
    pair = value
    if isinstance(value, str):
        match = RESOLUTION.fullmatch(text(value, path, type, max=256))
        if not match:
            return fail(path, type, 'WIDTHxHEIGHT')
        pair = [js.as_number(int(n)) for n in match.groups()]
    if not js.is_array(pair) or len(pair) != 2 or not all(
            js.is_safe_integer(n := js.as_number(x)) and 0 < n <= 2147483647 for x in pair):
        return fail(path, type, 'two positive 32-bit pixel dimensions')
    return f'{js.to_string(pair[0])}x{js.to_string(pair[1])}'
