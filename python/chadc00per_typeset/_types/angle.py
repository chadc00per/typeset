"""angle: degrees, wrapped into [0, 360); text may end in deg or °."""
from __future__ import annotations

import re

from .._lib.number import number

UNIT = re.compile(r'(?:[Dd][Ee][Gg]|°)\Z')  # JS /i, ASCII letters only


def normalize(value, path, type):
    return number(value, path, type, unit=UNIT, wrap=360)
