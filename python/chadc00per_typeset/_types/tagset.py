"""tagset: a set of tags, deduplicated and sorted so equal sets are equal values
(index keys, uniqueness). An array, or comma-separated text."""
from __future__ import annotations

from .._lib import js
from .._lib.tags import list, tag


def normalize(value, path, type):
    return sorted(dict.fromkeys(tag(item, f'{path}[{i}]') for i, item in enumerate(list(value, path, type))), key=js.utf16_key)


# TagSet.normalize_item(): ONE element, as a query operand compared against the set's items.
methods = {'normalize_item': lambda value, path='tagset': tag(value, path)}
