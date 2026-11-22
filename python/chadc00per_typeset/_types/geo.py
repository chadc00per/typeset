"""geo: a coordinate pair [longitude, latitude] on the globe."""
from __future__ import annotations

from .._lib.errors import ValidationError
from .._lib.point import point


def normalize(value, path, type):
    lng, lat = point(value, path, size=2, shape='a [lng, lat] coordinate pair', finite='a [lng, lat] coordinate pair')
    if lng < -180 or lng > 180:
        raise ValidationError(f'{path} longitude must be within [-180, 180]', 'range')
    if lat < -90 or lat > 90:
        raise ValidationError(f'{path} latitude must be within [-90, 90]', 'range')
    return [lng, lat]
