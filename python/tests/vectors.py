"""Reading conformance/vectors/: the JavaScript reference's answer for each input."""
from __future__ import annotations

import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # the repository root
_EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)


def decode(value):
    """JSON, with { "$js": "NaN" | "Infinity" | "-Infinity" | "-0" } as those
    numbers and { "$js": "Date", "value": ms } as an aware UTC datetime."""
    if isinstance(value, list):
        return [decode(v) for v in value]
    if isinstance(value, dict):
        if '$js' in value:
            special = value['$js']
            if special == 'Date':
                return _EPOCH + timedelta(milliseconds=value['value'])
            return {'NaN': math.nan, 'Infinity': math.inf, '-Infinity': -math.inf, '-0': -0.0}[special]
        return {k: decode(v) for k, v in value.items()}
    return value


def _file(name):
    return json.loads((ROOT / 'conformance' / 'vectors' / f'{name}.json').read_text(encoding='utf-8'))


def load(name):
    return _file(name)['cases']


def clock(name):
    return _file(name)['now']


def catalog():
    return json.loads((ROOT / 'data' / 'catalog.json').read_text(encoding='utf-8'))
