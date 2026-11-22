"""geojson: an RFC 7946 geometry, Feature or FeatureCollection, as an object or
JSON text. Positions are [longitude, latitude] or with an altitude, on the
globe; line strings need two positions and polygon rings four, closed.
Foreign members are kept, but a non-finite number in one is refused. Ring
winding isn't checked (RFC 7946 tells parsers not to refuse it). A Feature
without geometry or properties gets null. The stored value is the input as
JSON would carry it."""
from __future__ import annotations

import json
import math
from datetime import datetime, timezone

from .._lib import js
from .._lib.errors import fail
from .._lib.text import CONTROL_EXCEPT_WHITESPACE, text

# Geometry types by what their coordinates nest: 0 a position, 1 a list of them, and so on.
GEOMETRY_DEPTH = {'Point': 0, 'MultiPoint': 1, 'LineString': 1, 'MultiLineString': 2, 'Polygon': 2, 'MultiPolygon': 3}
# GeometryCollections inside GeometryCollections, which RFC 7946 discourages, nest at most this deep.
MAX_COLLECTION_DEPTH = 8
# Arrays and objects nest at most this deep, foreign members included. Checked
# without recursion before anything else, so the answer never depends on how
# deep a runtime's JSON parser or serializer can recurse.
MAX_NESTING = 64
NESTING = f'nested at most {MAX_NESTING} levels deep'

_MISSING = object()


class _Unserializable(Exception):
    """JSON.stringify would throw (a cycle, or a value JSON can't carry)."""


def _refuse_constant(name):
    # JSON.parse refuses NaN, Infinity and -Infinity literals.
    raise ValueError(name)


def _parse_int(digits):
    # JSON.parse reads every number as a double.
    return js.wire_number(int(digits)) if len(digits) < 17 else js.wire_number(float(digits))


def _iso(d: datetime) -> str:
    """Date.prototype.toJSON()."""
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    d = d.astimezone(timezone.utc)
    return d.strftime('%Y-%m-%dT%H:%M:%S.') + f'{d.microsecond // 1000:03d}Z'


def _property_key(v) -> str:
    """String(v), as a property lookup converts its key."""
    if v is _MISSING:
        return 'undefined'
    if v is None:
        return 'null'
    if isinstance(v, str):
        return v
    if js.is_number(v) or isinstance(v, bool):
        return js.to_string(v)
    if js.is_array(v):
        return ','.join('' if x is None or x is _MISSING else _property_key(x) for x in v)
    if js.is_object(v):
        return '[object Object]'
    return str(v)


def _stringify(v) -> str:
    """JSON.stringify(v) for comparing two positions by their JSON text."""
    if v is None or (js.is_number(v) and not js.is_finite(v)):
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if js.is_number(v):
        return js.to_string(v)
    if isinstance(v, str):
        return json.dumps(v, ensure_ascii=False)
    if isinstance(v, datetime):
        return json.dumps(_iso(v))
    if js.is_array(v):
        return '[' + ','.join(_stringify(x) for x in v) + ']'
    if js.is_object(v):
        return '{' + ','.join(f'{json.dumps(_property_key(k), ensure_ascii=False)}:{_stringify(x)}' for k, x in v.items()) + '}'
    return repr(v)


_MAX_SAFE = js.MAX_SAFE_INTEGER


def _too_deep_text(raw: str) -> bool:
    """Whether JSON text opens more than MAX_NESTING arrays and objects at once."""
    depth, string, i = 0, False, 0
    while i < len(raw):
        c = raw[i]
        if string:
            if c == '\\':
                i += 1
            elif c == '"':
                string = False
        elif c == '"':
            string = True
        elif c in '[{':
            depth += 1
            if depth > MAX_NESTING:
                return True
        elif c in ']}':
            depth -= 1
        i += 1
    return False


def _too_deep_value(value) -> bool:
    """Whether a value holds arrays and objects more than MAX_NESTING deep (a cycle always does)."""
    stack = [(value, 1)]
    while stack:
        v, depth = stack.pop()
        if js.is_array(v):
            items = v
        elif js.is_object(v):
            items = v.values()
        else:
            continue
        if depth > MAX_NESTING:
            return True
        stack.extend((x, depth + 1) for x in items)
    return False


def _carry(v, state, stack):
    """The value as JSON.parse(JSON.stringify(v)) gives it back, noting non-finite
    numbers. Numbers come out in wire form (whole ones as ints), so the registry
    needn't walk the result again (WIRED)."""
    t = type(v)
    if t is str or v is None or t is bool:
        return v
    if t is int:  # js.wire_number(), inlined: this runs once per coordinate
        return v if -_MAX_SAFE <= v <= _MAX_SAFE else float(v)
    if t is float:
        if not math.isfinite(v):
            state['lossy'] = True
            return None
        return int(v) if v.is_integer() and -_MAX_SAFE <= v <= _MAX_SAFE else v
    if t is list or t is tuple or t is dict:
        pass
    elif js.is_number(v):
        return _carry(float(v) if isinstance(v, float) else int(v), state, stack)
    elif isinstance(v, str):
        return str(v)
    elif isinstance(v, datetime):
        return _iso(v)
    if js.is_array(v) or js.is_object(v):
        if id(v) in stack:
            raise _Unserializable
        stack.add(id(v))
        try:
            if js.is_array(v):
                return [None if callable(x) else _carry(x, state, stack) for x in v]
            return {_property_key(k): _carry(x, state, stack) for k, x in v.items() if not callable(x)}
        finally:
            stack.discard(id(v))
    raise _Unserializable


# normalize() returns numbers in wire form already (see _carry).
WIRED = True


def normalize(value, path, type):
    if isinstance(value, str):
        raw = text(value, path, type, max=16 * 1024 * 1024, control=CONTROL_EXCEPT_WHITESPACE)
        if _too_deep_text(raw):
            return fail(path, type, NESTING)
        try:
            value = json.loads(raw, parse_constant=_refuse_constant, parse_int=_parse_int)
        except (ValueError, RecursionError):
            return fail(path, type, 'JSON')
    elif _too_deep_value(value):
        return fail(path, type, NESTING)

    def plain(v):
        return js.is_object(v)

    def bbox(v, at):
        b = v.get('bbox', _MISSING)
        if b is not _MISSING and (not js.is_array(b) or len(b) not in (4, 6) or not all(js.is_finite(n) for n in b)):
            return fail(f'{at}.bbox', type, '4 or 6 finite numbers')

    def position(p, at):
        if not js.is_array(p) or len(p) < 2 or len(p) > 3 or not all(js.is_finite(n) for n in p):
            return fail(at, type, '[longitude, latitude] or with altitude')
        if p[0] < -180 or p[0] > 180 or p[1] < -90 or p[1] > 90:
            return fail(at, type, 'longitude within [-180, 180], latitude within [-90, 90]')

    def coordinates(c, depth, kind, at):
        if depth == 0:
            return position(c, at)
        if not js.is_array(c):
            return fail(at, type, 'coordinate array')
        if depth == 1 and kind == 'LineString' and len(c) < 2:
            return fail(at, type, 'at least two positions')
        if depth == 1 and kind == 'ring':
            if len(c) < 4:
                return fail(at, type, 'closed ring of at least four positions')
            if js.is_array(c[0]) and _stringify(c[0]) != _stringify(c[-1]):
                return fail(at, type, 'closed ring: last position equals the first')
        inner = ('ring' if (kind == 'Polygon' and depth == 2) or (kind == 'MultiPolygon' and depth == 2)
                 else 'LineString' if kind == 'MultiLineString' and depth == 2 else kind)
        for i, item in enumerate(c):
            coordinates(item, depth - 1, inner, f'{at}[{i}]')

    def geometry(g, at, nesting=0):
        if not plain(g):
            return fail(at, type, 'geometry object')
        bbox(g, at)
        kind = g.get('type', _MISSING)
        if kind == 'GeometryCollection':
            geometries = g.get('geometries', _MISSING)
            if not js.is_array(geometries) or nesting >= MAX_COLLECTION_DEPTH:
                return fail(f'{at}.geometries', type, 'array of geometries')
            for i, item in enumerate(geometries):
                geometry(item, f'{at}.geometries[{i}]', nesting + 1)
            return
        key = _property_key(kind)
        if key not in GEOMETRY_DEPTH:
            return fail(f'{at}.type', type, 'GeoJSON type')
        coordinates(g.get('coordinates', _MISSING), GEOMETRY_DEPTH[key], kind, f'{at}.coordinates')

    def feature(f, at):
        if not plain(f) or f.get('type', _MISSING) != 'Feature':
            return fail(at, type, 'Feature')
        bbox(f, at)
        g = f.get('geometry', _MISSING)
        if g is not None and g is not _MISSING:
            geometry(g, f'{at}.geometry')
        properties = f.get('properties', _MISSING)
        if properties is not None and properties is not _MISSING and not plain(properties):
            return fail(f'{at}.properties', type, 'object or null')
        id = f.get('id', _MISSING)
        if id is not _MISSING and not isinstance(id, str) and not js.is_finite(id):
            return fail(f'{at}.id', type, 'string or number')
        out = dict(f)
        out['geometry'] = None if g is _MISSING else g
        out['properties'] = None if properties is _MISSING else properties
        return out

    if not plain(value):
        return fail(path, type, 'GeoJSON object')
    result = value
    kind = value.get('type', _MISSING)
    if kind == 'Feature':
        result = feature(value, path)
    elif kind == 'FeatureCollection':
        bbox(value, path)
        features = value.get('features', _MISSING)
        if not js.is_array(features):
            return fail(f'{path}.features', type, 'array of Features')
        result = dict(value)
        result['features'] = [feature(f, f'{path}.features[{i}]') for i, f in enumerate(features)]
    else:
        geometry(value, path)
    # JSON would turn NaN and Infinity into null, losing them silently.
    state = {'lossy': False}
    try:
        carried = _carry(result, state, set())
    except (_Unserializable, RecursionError):
        return fail(path, type, 'JSON-serializable')
    if state['lossy']:
        return fail(path, type, 'finite numbers only')
    return carried
