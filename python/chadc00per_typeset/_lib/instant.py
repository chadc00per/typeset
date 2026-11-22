"""UTC instants shared by expiry and datetimewindow.

JS Date arithmetic is done here in integer milliseconds: ``days_from_civil`` and
``civil_from_days`` stand in for Date.UTC and the getUTC* readers, so years
outside Python's datetime range still behave as JS's Date does."""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone

from . import js
from .calendar import valid_day
from .errors import fail
from .text import text

DAY_MS = 86400000
# The most milliseconds from the epoch a JS Date holds (TimeClip).
MAX_TIME = 8_640_000_000_000_000
_EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)

_TIMESTAMP = re.compile(r'([0-9]{4}-[0-9]{2}-[0-9]{2})[Tt]([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.([0-9]{1,3}))?([Zz]|[+-][0-9]{2}:[0-9]{2})')


def days_from_civil(y, m, d):
    """Days since 1970-01-01 of a proleptic Gregorian date (month 1..12)."""
    y -= m <= 2
    era = y // 400
    yoe = y - era * 400
    doy = (153 * (m + (-3 if m > 2 else 9)) + 2) // 5 + d - 1
    doe = yoe * 365 + yoe // 4 - yoe // 100 + doy
    return era * 146097 + doe - 719468


def civil_from_days(z):
    """(year, month 1..12, day) of a day count since 1970-01-01."""
    z += 719468
    era = z // 146097
    doe = z - era * 146097
    yoe = (doe - doe // 1460 + doe // 36524 - doe // 146096) // 365
    y = yoe + era * 400
    doy = doe - (365 * yoe + yoe // 4 - yoe // 100)
    mp = (5 * doy + 2) // 153
    d = doy - (153 * mp + 2) // 5 + 1
    m = mp + 3 if mp < 10 else mp - 9
    return y + (m <= 2), m, d


def date_ms(value: datetime) -> int:
    """Date.prototype.getTime() of a datetime (a naive one is read as UTC)."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return (value - _EPOCH) // timedelta(milliseconds=1)


def iso_string(ms: int) -> str:
    """Date.prototype.toISOString() for a year 0001..9999."""
    days, rest = divmod(ms, DAY_MS)
    y, m, d = civil_from_days(days)
    return (f'{y:04d}-{m:02d}-{d:02d}T{rest // 3600000:02d}:{rest // 60000 % 60:02d}:'
            f'{rest // 1000 % 60:02d}.{rest % 1000:03d}Z')


# A UTC ISO timestamp, from an ISO string with a zone, epoch milliseconds or a Date.
def instant(value, path, type):
    if isinstance(value, str):
        raw = text(value, path, type, max=256)
        match = _TIMESTAMP.fullmatch(raw)
        if not match:
            return fail(path, type, 'ISO timestamp with timezone')
        valid_day(match[1], path, type)
        if int(match[2]) > 23 or int(match[3]) > 59 or int(match[4]) > 59:
            return fail(path, type)
        zone = match[6]
        if zone.upper() != 'Z' and (int(zone[1:3]) > 23 or int(zone[4:]) > 59):
            return fail(path, type)
        # Date.parse(raw)
        y, mo, d = (int(g) for g in match[1].split('-'))
        offset = 0 if zone.upper() == 'Z' else (1 if zone[0] == '+' else -1) * (int(zone[1:3]) * 60 + int(zone[4:])) * 60000
        value = (days_from_civil(y, mo, d) * DAY_MS + int(match[2]) * 3600000 + int(match[3]) * 60000
                 + int(match[4]) * 1000 + int((match[5] or '').ljust(3, '0')) - offset)
    elif isinstance(value, datetime):
        value = date_ms(value)
    if not js.is_safe_integer(value):
        return fail(path, type, 'whole epoch milliseconds or ISO timestamp')
    value = int(value)
    if abs(value) > MAX_TIME:  # new Date(value) is an Invalid Date
        return fail(path, type)
    year = civil_from_days(value // DAY_MS)[0]
    if year < 1 or year > 9999:
        return fail(path, type)
    return iso_string(value)
