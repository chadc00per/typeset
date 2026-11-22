"""color: hex, rgb() or hsl() (with optional opacity) or transparent, stored as
lowercase hex, with alpha only when not opaque. Input may come pasted from CSS,
so tabs and line breaks are whitespace here."""
from __future__ import annotations

import math
import re

from .._lib import js
from .._lib.errors import fail
from .._lib.text import CONTROL_EXCEPT_WHITESPACE, DECIMAL, DECIMAL_SOURCE, ascii_lower, text

HUE = re.compile(f'({DECIMAL_SOURCE})(deg|grad|rad|turn)?')
HEX = re.compile('#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})')
# JS `.` stops at line terminators.
FUNCTION = re.compile('(rgb|rgba|hsl|hsla)\\(([^\n\r  ]*)\\)')
UNITS = {'deg': 1, 'grad': 0.9, 'rad': 180 / math.pi, 'turn': 360}


def component(raw, max, path):
    """One color channel as a fraction of its range."""
    percent = raw.endswith('%')
    digits = raw[:-1] if percent else raw
    n = js.to_number(digits) if DECIMAL.fullmatch(digits) else math.nan
    if not math.isfinite(n) or n < 0 or n > (100 if percent else max):
        return fail(path, 'color')
    return n / 100 if percent else n / max


def normalize(value, path, type):
    raw = ascii_lower(text(value, path, type, max=256, control=CONTROL_EXCEPT_WHITESPACE, empty=True))
    if raw == 'transparent':
        return '#00000000'
    if HEX.fullmatch(raw):
        hex = raw[1:]
        if len(hex) <= 4:
            hex = ''.join(c + c for c in hex)
        return '#' + (hex[:6] if len(hex) == 8 and hex.endswith('ff') else hex)
    match = FUNCTION.fullmatch(raw)
    if not match:
        return fail(path, type)
    legacy = ',' in match[2]
    parts = [js.trim(s) for s in match[2].split(',')] if legacy else re.split(f'{js.S}*/{js.S}*', js.trim(match[2]))
    if legacy:
        if len(parts) not in (3, 4) or any(re.search(f'{js.S}|/', p) for p in parts):
            return fail(path, type)
        channels = parts[:3]
        alpha = parts[3] if len(parts) > 3 else None
    else:
        if len(parts) > 2:
            return fail(path, type)
        channels = re.split(js.S + '+', parts[0])
        alpha = parts[1] if len(parts) > 1 else None
        if len(channels) != 3:
            return fail(path, type)
    if match[1].startswith('rgb'):
        if legacy and not all(c.endswith('%') == channels[0].endswith('%') for c in channels):
            return fail(path, type)
        rgb = [component(c, 255, path) for c in channels]
    else:
        hue = HUE.fullmatch(channels[0])
        if not hue or not math.isfinite(js.to_number(hue[1])) or not channels[1].endswith('%') or not channels[2].endswith('%'):
            return fail(path, type)
        degrees = js.to_number(hue[1]) * UNITS[hue[2] or 'deg']
        if not math.isfinite(degrees):
            return fail(path, type)
        h = js.js_mod(js.js_mod(degrees, 360) + 360, 360) / 30
        s = component(channels[1], 1, path)
        l = component(channels[2], 1, path)
        a = s * min(l, 1 - l)

        def channel(n):
            k = js.js_mod(n + h, 12)
            return l - a * max(-1, min(k - 3, 9 - k, 1))
        rgb = [channel(n) for n in (0, 8, 4)]
    bytes = [js.js_round(n * 255) for n in [*rgb, 1 if alpha is None else component(alpha, 1, path)]]
    if bytes[3] == 255:
        bytes.pop()
    return '#' + ''.join(format(n, 'x').rjust(2, '0') for n in bytes)
