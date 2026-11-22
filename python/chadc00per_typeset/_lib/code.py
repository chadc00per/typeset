"""Syntax checks for the code types javascript, python, html, css and svg
(js/src/lib/code.js). They run js/src/lib/code.js itself, bundled with its parsers
into _parsers.js by js/scripts/generate-python-parsers.js, in an embedded V8
(mini-racer), so this package answers every input exactly as the JavaScript
one does. The V8 context starts on the first code check, so a program that
never checks code never pays for it. A source is only parsed, never run."""
from __future__ import annotations

import threading
from pathlib import Path

_BUNDLE = Path(__file__).resolve().parent.parent / '_parsers.js'
_lock = threading.Lock()  # a mini-racer context is not safe to share between threads unguarded
_context = None


def parses(language: str, source: str) -> bool:
    """Whether ``source`` parses as ``language`` (javascript, python, html, css or svg)."""
    global _context
    with _lock:
        if _context is None:
            from py_mini_racer import MiniRacer
            context = MiniRacer()
            context.eval(_BUNDLE.read_text(encoding='utf-8'))
            _context = context
        return _context.call(f'typesetParsers.{language}', source) is True
