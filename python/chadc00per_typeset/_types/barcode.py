"""barcode: any printable ASCII barcode payload, kept exactly: independent of
symbology, not an image or a claim of GS1 allocation. Edge spaces can be
meaningful and are preserved."""
from __future__ import annotations

import re

from .._lib import js
from .._lib.errors import fail
from .._lib.text import text


def normalize(value, path, type):
    text(value, path, type)
    return value if js.length(value) <= 256 and re.fullmatch('[\x20-\x7e]+', value) else fail(path, type)
