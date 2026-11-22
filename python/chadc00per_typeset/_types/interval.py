"""interval: a nonnegative duration as canonical ISO 8601 (P1Y2M, PT1M30S).
Calendar months are kept; days and smaller units are exact milliseconds, so
"24h" is P1D. A number is milliseconds."""
from __future__ import annotations

from .._lib.duration import duration


def normalize(value, path, type):
    span = duration(value, path, type)
    months, ms = span['months'], span['ms']
    y, m = months // 12, months % 12
    d = ms // 86400000; ms %= 86400000
    h = ms // 3600000; ms %= 3600000
    minutes = ms // 60000; ms %= 60000
    seconds = f"{ms // 1000}{'.' + str(ms % 1000).rjust(3, '0').rstrip('0') if ms % 1000 else ''}S" if ms else ''
    date = f"{f'{y}Y' if y else ''}{f'{m}M' if m else ''}{f'{d}D' if d else ''}"
    clock = f"{f'{h}H' if h else ''}{f'{minutes}M' if minutes else ''}{seconds}"
    return f"P{date}{'T' + clock if clock else ''}" if date or clock else 'PT0S'
