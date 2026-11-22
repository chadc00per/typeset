"""tag: a label, lowercase with whitespace collapsed, at most 64 characters."""
from __future__ import annotations

from .._lib.tags import tag


def normalize(value, path, type):
    return tag(value, path, type)
