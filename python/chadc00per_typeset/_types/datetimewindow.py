"""datetimewindow: an ordered pair [start, end] of UTC timestamps, start not after end."""
from __future__ import annotations

from .._lib import js
from .._lib.errors import fail
from .._lib.instant import instant


def normalize(value, path, type):
    if not js.is_array(value) or len(value) != 2:
        return fail(path, type, '[start, end]')
    pair = [instant(value[0], f'{path}[0]', type), instant(value[1], f'{path}[1]', type)]
    if pair[0] > pair[1]:
        return fail(path, type, 'start must not be after end')
    return pair
