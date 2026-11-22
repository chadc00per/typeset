"""srt: a SubRip timestamp offset HH:MM:SS,mmm (hours beyond 24 allowed)."""
from __future__ import annotations

from .._lib.subtitles import cue


def normalize(value, path, type):
    return cue(value, path, type, 'srt')
