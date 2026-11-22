"""expiry: a UTC timestamp. A duration ("30d", "P1M") resolves once, when
normalized, against `now` (default: the clock); calendar months are added in
UTC and clamped to the target month's last day. validate() takes only
canonical stored values, so a stored relative expiry is refused rather than
resolved against a new clock."""
from __future__ import annotations

import math
from datetime import datetime

from .._lib import js
from .._lib.calendar import is_leap
from .._lib.duration import DURATION_TEXT, duration
from .._lib.instant import DAY_MS, MAX_TIME, civil_from_days, date_ms, days_from_civil, instant


def _time(now):
    """new Date(now ?? Date.now()).getTime(), None for an Invalid Date."""
    if now is None:
        now = js.now()
    elif isinstance(now, datetime):
        now = date_ms(now)
    if not js.is_number(now) or not math.isfinite(now) or abs(now) > MAX_TIME:
        return None
    return int(now)  # TimeClip truncates toward zero


def normalize(value, path, type, now=None):
    if isinstance(value, str) and DURATION_TEXT.match(js.trim(value)):
        span = duration(value, path, type)
        months, ms = span['months'], span['ms']
        time = _time(now)
        if time is not None and months:
            days, clock = divmod(time, DAY_MS)
            y, m, day_of_month = civil_from_days(days)
            y, m = y + (m - 1 + months) // 12, (m - 1 + months) % 12 + 1
            last = [31, 29 if is_leap(y) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
            time = days_from_civil(y, m, min(day_of_month, last)) * DAY_MS + clock
            if abs(time) > MAX_TIME:
                time = None
        return instant(math.nan if time is None else time + ms, path, type)
    return instant(value, path, type)
