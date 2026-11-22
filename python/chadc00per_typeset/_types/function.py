"""function: the source code of one function in this package's own language,
stored as text: trimmed, with CRLF and CR line endings as LF (the same rules
as js/src/types/function.js). Here that is Python: a def or async def (decorators
allowed) or a lambda, checked by parsing it with the running Python's ast
module, so the syntax accepted is that Python version's. The source is only
parsed, never run.

This is the one type whose accepted inputs differ by language: the npm
package's `function` holds JavaScript source, so it has no shared conformance
vectors (python/tests/test_function.py covers it). JS also reads a function
value as its source; Python can't reliably recover a function's source, so
only strings are read."""
from __future__ import annotations

import ast

from .._lib.errors import fail
from .._lib.source import source

MAX_SOURCE = 65536


def _is_function(code: str) -> bool:
    try:
        module = ast.parse(code, mode='exec')
    except (SyntaxError, ValueError, RecursionError, MemoryError):
        # A syntax error, or nesting deep enough to exhaust the parser: either way, not a function.
        return False
    if len(module.body) != 1:
        return False
    node = module.body[0]
    return isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) or (
        isinstance(node, ast.Expr) and isinstance(node.value, ast.Lambda))


def normalize(value, path, type):
    code = source(value, path, type, MAX_SOURCE)
    return code if _is_function(code) else fail(path, type, 'one function')
