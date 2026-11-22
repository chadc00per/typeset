"""hostname: a DNS hostname, like domain but single-label local names such as
localhost are allowed."""
from __future__ import annotations

from .._lib.hostname import hostname


def normalize(value, path, type):
    return hostname(value, path, type)
