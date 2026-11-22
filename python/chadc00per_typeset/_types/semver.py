"""semver: a Semantic Versioning 2.0.0 version, kept exactly. Components stay
text, so arbitrarily large integers remain exact; prerelease and build
identifier case and build metadata are significant data."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.text import text

SEMVER = re.compile(r'(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?')


def normalize(value, path, type):
    raw = text(value, path, type, max=512, control=None, empty=True)
    m = SEMVER.fullmatch(raw)
    if not m or (m[4] is not None and any(re.fullmatch('0[0-9]+', part) for part in m[4].split('.'))):
        return fail(path, type)
    return raw
