"""timeprecision: one fixed time precision unit: ns, us, ms, s, m, h or d."""
from __future__ import annotations

from .._lib.errors import fail
from .._lib.text import CONTROL_EXCEPT_TAB, ascii_lower, text

OPTIONS = ('ns', 'us', 'ms', 's', 'm', 'h', 'd')


def normalize(value, path, type):
    unit = ascii_lower(text(value, path, type, max=256, control=CONTROL_EXCEPT_TAB, empty=True))
    return unit if unit in OPTIONS else fail(path, type)
