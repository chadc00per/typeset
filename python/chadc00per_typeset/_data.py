"""The pinned reference data (data/*.json) and the catalog (data/catalog.json, generated from the JavaScript reference),
shared with the JavaScript package. A wheel carries copies under chadc00per_typeset/data/;
a source checkout reads the repository's own files."""
from __future__ import annotations

import json
from functools import cache
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parents[1]


@cache
def load(name: str):
    """data/<name>, parsed once."""
    for place in (_HERE / 'data' / name, _ROOT / 'data' / name):
        if place.is_file():
            return json.loads(place.read_text(encoding='utf-8'))
    raise FileNotFoundError(f'chadc00per_typeset: data file {name} is missing from the installation')
