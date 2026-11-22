"""cron: a five-field cron expression, month and weekday names read as numbers.
Term and wildcard structure is kept: rewriting day fields to expanded sets can
change cron's day-of-month/day-of-week interaction. A field's comma list is a
set of terms, so each term is stored once and in order (* first, then by
start, end and step): "15,1", "1,15" and "1,1,15" are one schedule, one spelling."""
from __future__ import annotations

import re

from .._lib.calendar import MONTHS, WEEKDAYS
from .._lib.errors import fail
from .._lib.text import ascii_upper, text

CRON_MONTHS = [name[:3].upper() for name in MONTHS]
CRON_DAYS = [name[:3].upper() for name in [WEEKDAYS[6], *WEEKDAYS[:6]]]
LIMITS = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]]
_DIGITS = re.compile('[0-9]+')
_TERM = re.compile(r'(\*|[0-9]+)(?:-([0-9]+))?(?:/([0-9]+))?')


def _term_key(term):
    """The order terms are stored in: * first, then by start, end and step."""
    start, end, step = _TERM.fullmatch(term).groups()
    step = int(step or 1)
    return (-1, 0, step) if start == '*' else (int(start), int(end or start), step)


def _index(names, part):
    return names.index(part) if part in names else -1


def normalize(value, path, type):
    fields = re.split('[ \t]+', ascii_upper(text(value, path, type, max=512, control=re.compile('[\r\n]'), empty=True)))
    if len(fields) != 5:
        return fail(path, type, 'five fields, no command')

    def field_text(index, field):
        min, max = LIMITS[index]

        def endpoint(part):
            name = _index(CRON_MONTHS, part) + 1 if index == 3 else _index(CRON_DAYS, part) if index == 4 else -1
            n = int(part) if _DIGITS.fullmatch(part) else name
            if n < min or n > max:
                return fail(path, type)
            return n

        def term_text(term):
            pieces = term.split('/')
            if len(pieces) > 2 or not pieces[0]:
                return fail(path, type)
            if pieces[0] == '*':
                base = '*'
            else:
                pair = pieces[0].split('-')
                if len(pair) > 2 or any(not p for p in pair):
                    return fail(path, type)
                nums = [endpoint(p) for p in pair]
                if len(nums) == 2 and nums[0] > nums[1]:
                    return fail(path, type)
                # Sunday is 0 or 7 in the weekday field; a lone 7 is stored as 0 so one
                # schedule has one spelling (a range such as 5-7 keeps its 7).
                if index == 4 and len(nums) == 1 and nums[0] == 7:
                    nums[0] = 0
                base = '-'.join(str(n) for n in nums)
            if len(pieces) == 1:
                return base
            if (base != '*' and '-' not in base) or not _DIGITS.fullmatch(pieces[1]):
                return fail(path, type)
            step = int(pieces[1])
            if step < 1 or step > max - min + 1:
                return fail(path, type)
            return f'{base}/{step}'

        terms = [term_text(term) for term in field.split(',')]
        return ','.join(sorted(dict.fromkeys(terms), key=_term_key))

    return ' '.join(field_text(index, field) for index, field in enumerate(fields))
