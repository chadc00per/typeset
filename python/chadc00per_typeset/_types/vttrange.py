"""vttrange: WebVTT cue timing "start --> end", the end strictly after the start."""
from __future__ import annotations

from .._lib.subtitles import cue_range


def normalize(value, path, type):
    return cue_range(value, path, type, 'vtt')
