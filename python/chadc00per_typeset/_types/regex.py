"""regex: a JavaScript regular expression as a /source/flags literal, checked by
the runtime's RegExp. A bare pattern has no flags; flags come out in canonical
order. Input is trimmed: write a pattern with edge spaces as a literal. The
pattern is only compiled, never run, so this says nothing about its speed.

Python has no RegExp, so the pattern is checked by regress (an ECMAScript
regex engine) plus the few rules where regress accepts what V8 refuses, and
RegExp's source and flags getters are reproduced here. JS accepts a real
RegExp object as well; Python has no such object, so only strings are read."""
from __future__ import annotations

import re

from .._lib.errors import fail
from .._lib.text import CONTROL_EXCEPT_TAB, text

_LITERAL = re.compile(r'/(.+)/([a-z]*)', re.S)  # /^\/([\s\S]+)\/([a-z]*)$/
# RegExp.prototype.flags order: hasIndices, global, ignoreCase, multiline, dotAll, unicode, unicodeSets, sticky.
FLAGS = 'dgimsuvy'
_LINE_TERMINATORS = {'\n': '\\n', '\r': '\\r', ' ': '\\u2028', ' ': '\\u2029'}
_QUANTIFIER = re.compile(r'[*+?]|\{[0-9]+(?:,[0-9]*)?\}')
_HEX4 = re.compile('[0-9A-Fa-f]{4}')
_CODE_POINT = re.compile(r'\{[0-9A-Fa-f]+\}')
_SURROGATE = re.compile('[\ud800-\udfff]')


class _Invalid(Exception):
    pass


def _flags(flags: str) -> str:
    """The flags getter's canonical spelling; a SyntaxError (here _Invalid) for
    an unknown or repeated flag, or u with v."""
    if any(f not in FLAGS for f in flags) or len(set(flags)) != len(flags) or ('u' in flags and 'v' in flags):
        raise _Invalid
    return ''.join(f for f in FLAGS if f in flags)


def _source(pattern: str) -> str:
    """The source getter (V8's EscapeRegExpSource): an unescaped '/' outside a
    character class is escaped, line terminators are written as escapes (a
    backslash before one is dropped), and the empty pattern reads '(?:)'."""
    if not pattern:
        return '(?:)'
    out = []
    in_class = False
    i = 0
    while i < len(pattern):
        c = pattern[i]
        if c == '\\':
            if i + 1 < len(pattern) and pattern[i + 1] in _LINE_TERMINATORS:
                pass  # this '\' is dropped: the next character is escaped itself
            else:
                out.append(pattern[i:i + 2])  # an escape: the next character is copied verbatim
                i += 2
                continue
        elif c == '/' and not in_class:
            out.append('\\/')
        elif c == '[':
            in_class = True
            out.append(c)
        elif c == ']':
            in_class = False
            out.append(c)
        elif c in _LINE_TERMINATORS:
            out.append(_LINE_TERMINATORS[c])
        else:
            out.append(c)
        i += 1
    return ''.join(out)


# With v, the class characters that may not appear doubled (ClassSetReservedDoublePunctuator).
_PUNCTUATORS = set('&!#$%*+,.:;<=>?@^`~')
# The Unicode properties of strings (only these can make a \p{…} match more than one character).
_STRING_PROPERTIES = {'Basic_Emoji', 'Emoji_Keycap_Sequence', 'RGI_Emoji_Modifier_Sequence', 'RGI_Emoji_Flag_Sequence',
                      'RGI_Emoji_Tag_Sequence', 'RGI_Emoji_ZWJ_Sequence', 'RGI_Emoji'}
_ESCAPE = re.compile(r'\\(?:u\{[0-9A-Fa-f]+\}|u[dD][89abAB][0-9A-Fa-f]{2}\\u[dD][c-fC-F][0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}'
                     r'|x[0-9A-Fa-f]{2}|c[A-Za-z]|[pP]\{[^}]*\}|.)', re.S)


def _strings_class(pattern: str, i: int):
    """With v, the class starting at pattern[i] ('['): where it ends and
    whether it may contain strings (MayContainStrings). A negated class that
    may contain strings is a SyntaxError (_Invalid), which regress misses.
    Anything else malformed is left for regress to refuse."""
    i += 1
    negated = pattern.startswith('^', i)
    if negated:
        i += 1
    operands, operator = [], None
    while pattern[i] != ']':
        if pattern.startswith('&&', i) or pattern.startswith('--', i):
            operator = pattern[i:i + 2]
            i += 2
            continue
        i, strings = _strings_operand(pattern, i)
        operands.append(strings)
    strings = (all(operands) if operator == '&&' else operands[0] if operator == '--' and operands
               else operator != '--' and any(operands))
    if negated and strings:
        raise _Invalid
    return i + 1, strings and not negated


def _strings_operand(pattern: str, i: int):
    if pattern[i] == '[':
        return _strings_class(pattern, i)
    if pattern.startswith('\\q{', i):
        i += 3
        lengths, count = [], 0
        while pattern[i] != '}':
            if pattern[i] == '|':
                lengths.append(count)
                count = 0
                i += 1
                continue
            escape = _ESCAPE.match(pattern, i) if pattern[i] == '\\' else None
            i = escape.end() if escape else i + 1
            count += 1
        lengths.append(count)
        return i + 1, any(n != 1 for n in lengths)
    if pattern[i] == '\\':
        escape = _ESCAPE.match(pattern, i)
        return escape.end(), escape[0][:3] == '\\p{' and escape[0][3:-1] in _STRING_PROPERTIES
    return i + 1, False


def _has_named_groups(pattern: str) -> bool:
    """Whether a "(?<name>" group appears outside a class: then \\k<…> is a
    group reference even without u or v."""
    in_class = False
    i = 0
    while i < len(pattern):
        c = pattern[i]
        if c == '\\':
            i += 2
            continue
        if c == '[':
            in_class = True
        elif c == ']':
            in_class = False
        elif not in_class and pattern.startswith('(?<', i) and pattern[i + 3:i + 4] not in ('=', '!'):
            return True
        i += 1
    return False


def _prepare(pattern: str, unicode) -> str:
    """The pattern as regress should read it, after the checks V8 makes and
    regress doesn't: a quantified \\b or \\B is a SyntaxError in every mode,
    with u or v a \\u must be followed by four hex digits or {code point}, and
    with v a negated class may not contain strings. Without u or v, \\u{41}
    outside a group name is not a code point escape but an identity-escaped "u"
    (then "{41}", a quantifier outside a class), which regress misreads, so it
    is handed over as a plain "u"."""
    # A surrogate pair Python holds as two code points is one character, as in JS.
    pattern = pattern.encode('utf-16-be', 'surrogatepass').decode('utf-16-be', 'surrogatepass')
    out = []
    in_class = 0
    names = not unicode and _has_named_groups(pattern)
    i = 0
    while i < len(pattern):
        c = pattern[i]
        if not in_class and ((pattern.startswith('(?<', i) and pattern[i + 3:i + 4] not in ('=', '!'))
                             or (names and pattern.startswith('\\k<', i))):
            end = pattern.find('>', i)
            if end != -1:  # a group name, where \u{…} is a code point escape in every mode
                out.append(pattern[i:end + 1])
                i = end + 1
                continue
        if c == '\\' and i + 1 < len(pattern):
            n = pattern[i + 1]
            if n in 'bB' and not in_class and _QUANTIFIER.match(pattern, i + 2):
                raise _Invalid
            if n == 'u':
                if unicode:
                    if not (_HEX4.match(pattern, i + 2) or _CODE_POINT.match(pattern, i + 2)):
                        raise _Invalid
                elif not _HEX4.match(pattern, i + 2):
                    out.append('u')
                    i += 2
                    continue
            # A lone surrogate (which regress can't take as text) escaped: identity-escaped U+E000 reads the same.
            out.append('\\\ue000' if _SURROGATE.fullmatch(n) else pattern[i:i + 2])
            i += 2
            continue
        if _SURROGATE.fullmatch(c):
            out.append(f'\\u{ord(c):04X}')  # a lone surrogate, as the escape regress can take
            i += 1
            continue
        if c == '[':
            if unicode == 'v' and not in_class:
                try:
                    _strings_class(pattern, i)
                except (IndexError, AttributeError):
                    pass  # malformed: regress refuses it
            in_class = in_class + 1 if unicode == 'v' else 1
            if unicode == 'v' and pattern.startswith('^', i + 1):
                out.append('[^')  # a negation, not a class character
                i += 2
                continue
        elif unicode == 'v' and in_class and c in _PUNCTUATORS:
            if pattern.startswith(c, i + 1):
                if c != '&':
                    raise _Invalid  # a reserved double punctuator
                out.append('&&')  # intersection (regress refuses a third '&')
                i += 2
                continue
            out.append('\\' + c)  # regress refuses some lone punctuators V8 reads as literals
            i += 1
            continue
        elif c == ']' and in_class:
            in_class -= 1
        out.append(c)
        i += 1
    return ''.join(out)


def compile(pattern: str, flags: str) -> str:
    """new RegExp(pattern, flags) as its /source/flags literal; _Invalid for a SyntaxError."""
    import regress
    canonical = _flags(flags)
    mode = 'v' if 'v' in canonical else 'u' in canonical
    try:
        # Only u and v change the syntax; v is read by regress as "uv".
        regress.Regex(_prepare(pattern, mode), 'uv' if mode == 'v' else 'u' if mode else '')
    except regress.RegressError:
        raise _Invalid from None
    return f'/{_source(pattern)}/{canonical}'


def normalize(value, path, type):
    raw = text(value, path, type, max=4096, control=CONTROL_EXCEPT_TAB)
    literal = _LITERAL.fullmatch(raw)
    try:
        return compile(literal[1], literal[2]) if literal else compile(raw, '')
    except _Invalid:
        return fail(path, type)
