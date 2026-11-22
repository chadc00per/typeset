"""domain: a DNS domain of at least two labels, lowercase ASCII (international
names converted). Not a public-suffix lookup."""
from __future__ import annotations

from .._lib.hostname import hostname


def normalize(value, path, type):
    return hostname(value, path, type, labels=2)
