"""locale: a canonical BCP 47 locale (Unicode BCP 47 locale identifier). The
tag is canonicalized here, not by any runtime library, so every runtime stores
the same value: the algorithm is the one ICU runs for Intl.Locale (parse,
legacy tags, alias replacement, variant and extension ordering, -u- and -t-
keyword aliases), with the alias tables pinned from one ICU
(data/locales.json, js/scripts/generate-locale-data.js). The pinned CLDR tables
then refuse invented languages, scripts, regions and variants; extension
values are syntax-checked, not registry-checked.

Mirrors js/src/types/locale.js line for line; ``None`` stands for JavaScript's
null and undefined alike."""
from __future__ import annotations

import re
from functools import cache

from .. import _data
from .._lib import js
from .._lib.cldr import contains
from .._lib.errors import fail
from .._lib.text import text


def normalize(value, path, type):
    raw = text(value, path, type)
    locale = _canonicalize(raw.replace('_', '-'))
    if not locale:
        return fail(path, type)
    language, script, region = locale['language'], locale['script'], locale['region']
    if (not contains('language', language or 'und') or
            (script and not contains('script', script)) or
            (region and not contains('localeRegion', region))):
        return fail(path, type)
    # The variants as the base name spells them: a lone POSIX variant reads as
    # "-u-va-posix" there, and is refused like any unregistered variant.
    variants = _base_name(locale).split('-')[1:]
    if script:
        variants.pop(0)
    if region:
        variants.pop(0)
    if any(not contains('variant', v) for v in variants):
        return fail(path, type)
    return _language_tag(locale)


# ---------------------------------------------------------------------------
# Subtag grammar.

_ALPHA = re.compile('[A-Za-z]+')
_DIGIT = re.compile('[0-9]+')
_ALNUM = re.compile('[A-Za-z0-9]+')


def _is_alpha(s, lo, hi):
    return lo <= js.length(s) <= hi and _ALPHA.fullmatch(s) is not None


def _is_digit(s, lo, hi):
    return lo <= js.length(s) <= hi and _DIGIT.fullmatch(s) is not None


def _is_alnum(s, lo, hi):
    return lo <= js.length(s) <= hi and _ALNUM.fullmatch(s) is not None


def _is_language(s):
    return _is_alpha(s, 2, 3) or _is_alpha(s, 5, 8)


def _is_script(s):
    return _is_alpha(s, 4, 4)


def _is_region(s):
    return _is_alpha(s, 2, 2) or _is_digit(s, 3, 3)


def _is_variant(s):
    return _is_alnum(s, 5, 8) or (js.length(s) == 4 and _is_digit(s[0], 1, 1) and _is_alnum(s, 4, 4))


def _is_singleton(s):
    return _is_alnum(s, 1, 1) and s.lower() != 'x'


def _is_unicode_key(s):
    return js.length(s) == 2 and _is_alnum(s[0], 1, 1) and _is_alpha(s[1], 1, 1)


def _is_tkey(s):
    return js.length(s) == 2 and _is_alpha(s[0], 1, 1) and _is_digit(s[1], 1, 1)


def _is_list(value, test):
    return all(test(s) for s in value.split('-'))


def _title(s):
    return s[0].upper() + s[1:].lower()


# The subtags compared are ASCII (the grammar checks them first), where Python
# orders strings as JavaScript does.
_MAX_KEYWORDS = 25
_MAX_VARIANTS = 179


def _starts_with_language_id(tag):
    """unicode_language_id at the start of the tag; what follows the first
    singleton is left to the parser."""
    tokens = tag.split('-')
    if tag.endswith('-'):
        tokens.pop()
    if not _is_language(tokens[0]):
        return False
    if len(tokens) == 1 or _is_alnum(tokens[1], 1, 1):
        return True
    i = 1
    if _is_script(tokens[i]):
        i += 1
        if i == len(tokens):
            return True
    if _is_region(tokens[i]):
        i += 1
    while i < len(tokens):
        if _is_alnum(tokens[i], 1, 1):
            return True
        if not _is_variant(tokens[i]):
            return False
        i += 1
    return True


def _is_transformed(value):
    """-t- content: tlang? (tkey tvalue+)*"""
    state = 'start'
    for s in value.split('-'):
        if state == 'start' and _is_alpha(s, 2, 8) and js.length(s) != 4:
            state = 'language'
        elif state == 'language' and _is_script(s):
            state = 'script'
        elif state in ('language', 'script') and _is_region(s):
            state = 'region'
        elif state in ('language', 'script', 'region', 'variant') and _is_variant(s):
            state = 'variant'
        elif state != 'key' and _is_tkey(s):
            state = 'key'
        elif state in ('key', 'value') and _is_alnum(s, 3, 8):
            state = 'value'
        else:
            return False
    return state != 'key'


# ---------------------------------------------------------------------------
# Parsing: a tag becomes {language, extlang, script, region, variants (upper
# case, in order), extensions (singleton -> value), privateuse}, or None if the
# whole tag does not parse and `strict`.

_LANG, _EXTL, _SCRT, _REGN, _VART, _EXTS, _EXTV, _PRIV = 1, 2, 4, 8, 16, 32, 64, 128


@cache
def _tables():
    data = _data.load('locales.json')
    region_choices = {
        region: {key: choice for choice, keys in by.items() for key in keys.split(' ')}
        for region, by in data['regionChoices'].items()
    }
    return {
        **data,
        'rules': {**data['languages'], **data['rules']},
        'regionChoices': region_choices,
        'variantDrops': {v: drops.split(' ') for v, drops in data['variantDrops'].items()},
    }


def _parse(input, strict):
    data = _tables()
    tag = input
    lower = tag.lower()
    for prefix, replacement in data['prefixes'].items():
        if lower.startswith(prefix) and (len(lower) == len(prefix) or lower[len(prefix)] == '-'):
            tag = replacement + tag[len(prefix):]
            break
    t = {'language': '', 'extlang': [], 'script': '', 'region': '', 'variants': [], 'extensions': {}, 'privateuse': ''}
    tokens = [] if js.length(tag) < 2 else tag.split('-')
    nxt, i, good, key, values, end, privateuse_variant = _LANG | _PRIV, 0, 0, None, [], 0, False

    def close_extension():
        nonlocal key, good
        if not values or key in t['extensions']:
            return False
        t['extensions'][key] = '-'.join(values).lower()
        key = None
        good = end
        return True

    while i < len(tokens):
        s = tokens[i]
        if nxt & _LANG and _is_alpha(s, 2, 8):
            t['language'] = s.lower()
            i += 1
            good = i
            nxt = _SCRT | _REGN | _VART | _EXTS | _PRIV | (_EXTL if js.length(s) <= 3 else 0)
            continue
        if nxt & _EXTL and _is_alpha(s, 3, 3):
            t['extlang'].append(s.lower())
            i += 1
            good = i
            nxt = (_EXTL if len(t['extlang']) < 3 else 0) | _SCRT | _REGN | _VART | _EXTS | _PRIV
            continue
        if nxt & _SCRT and _is_script(s):
            t['script'] = _title(s)
            i += 1
            good = i
            nxt = _REGN | _VART | _EXTS | _PRIV
            continue
        if nxt & _REGN and _is_region(s):
            t['region'] = s.upper()
            i += 1
            good = i
            nxt = _VART | _EXTS | _PRIV
            continue
        if nxt & _VART and (_is_variant(s) or (privateuse_variant and _is_alnum(s, 1, 8))):
            variant = s.upper()
            if variant in t['variants']:
                break
            t['variants'].append(variant)
            i += 1
            good = i
            nxt = _VART | _EXTS | _PRIV
            continue
        if nxt & _EXTS and _is_singleton(s):
            if key is not None and not close_extension():
                key = None
                break
            key = s.lower()
            values = []
            i += 1
            nxt = _EXTV
            continue
        if nxt & _EXTV and _is_alnum(s, 2, 8):
            values.append(s)
            i += 1
            end = i
            nxt = _EXTS | _EXTV | _PRIV
            continue
        if nxt & _PRIV and s.lower() == 'x':
            if key is not None and not close_extension():
                key = None
                break
            if i + 1 >= len(tokens):
                break
            # ICU reads "-x-lvariant-" (as written, lowercase) as the start of
            # more variants, of one to eight characters.
            j, last, lvariant = i + 1, 0, False
            while j < len(tokens):
                if tokens[j].startswith('lvariant'):
                    lvariant = True
                    j += 1
                    break
                if not _is_alnum(tokens[j], 1, 8):
                    break
                last = j + 1
                j += 1
            if lvariant:
                nxt = _VART
                privateuse_variant = True
                i = j
                continue
            if last:
                t['privateuse'] = '-'.join(tokens[i + 1:last]).lower()
                good = last
            break
        break
    if key is not None:
        close_extension()
    if strict and good != len(tokens):
        return None
    return t


# ---------------------------------------------------------------------------
# The locale as ICU holds it: {language ('' for und), script, region,
# variants (upper case), keywords}. Keywords map a -u- key to its value
# ("yes" when typeless), "attribute" to the sorted -u- attributes, and a
# singleton (x included) to its value.


def _unicode_value(key, value):
    return _tables()['keywords'].get(key, {}).get(value, value)


def _from_tag(t):
    first = t['extlang'][0] if t['extlang'] else t['language']
    locale = {
        'language': '' if first == 'und' else first,
        'script': t['script'],
        'region': t['region'],
        'variants': sorted(t['variants']),
        'keywords': {},
    }
    posix = False
    for key, value in sorted(t['extensions'].items(), key=lambda kv: kv[0]):
        if key != 'u':
            locale['keywords'][key] = value
            continue
        subtags = value.split('-')
        k = 0
        attributes = []
        while k < len(subtags) and not _is_unicode_key(subtags[k]):
            if subtags[k] not in attributes:
                attributes.append(subtags[k])
            k += 1
        if attributes:
            locale['keywords']['attribute'] = '-'.join(sorted(attributes))
        while k < len(subtags):
            name = subtags[k]
            k += 1
            type = []
            while k < len(subtags) and not _is_unicode_key(subtags[k]):
                type.append(subtags[k])
                k += 1
            canonical = _unicode_value(name, '-'.join(type)) if type else 'yes'
            if not t['variants'] and name == 'va' and canonical == 'posix':
                posix = True
            elif name not in locale['keywords']:
                locale['keywords'][name] = canonical
    if t['privateuse']:
        locale['keywords']['x'] = t['privateuse']
    if posix:
        locale['variants'].append('POSIX')
    return locale


def _fits(locale):
    """The ICU locale ID's own limits."""
    return len(locale['keywords']) <= _MAX_KEYWORDS and js.length('_'.join(locale['variants'])) <= _MAX_VARIANTS


def _for_language_tag(tag):
    """Locale::forLanguageTag: parse, then read back as a locale ID. An ID
    without keywords whose subtags (the last aside) include a one-character one
    (from "-x-lvariant-") is parsed again as a language tag, with "_" read as "-"."""
    t = _parse(tag, True)
    if not t:
        return None
    locale = _from_tag(t)
    id = '_'.join(f for f in (locale['language'], locale['script'], locale['region']) if f)
    if locale['variants']:
        id += ('_' if locale['region'] else '__') + '_'.join(locale['variants'])
    if not locale['keywords'] and any(js.length(s) == 1 for s in id.split('_')[:-1]):
        if not locale['language']:
            return None
        locale = _from_tag(_parse(id.replace('_', '-'), False))
    return locale if _fits(locale) else None


_FIRST_SCRIPT = re.compile('[A-Za-z]{4}[^A-Za-z]', re.DOTALL)


def _build(locale):
    """LocaleBuilder::build: the fields and keywords must be well-formed. The ID
    is rebuilt from "language-script-region-variants", where ICU reads a first
    variant of four letters and more straight after the language as a script
    (dropping the variants)."""
    if locale['language'] and not _is_alpha(locale['language'], 2, 8):
        return None
    if not all(_is_variant(v) for v in locale['variants']):
        return None
    for key, value in locale['keywords'].items():
        if key == 'attribute':
            ok = _is_list(value, lambda s: _is_alnum(s, 3, 8))
        elif key == 't':
            ok = _is_transformed(value)
        elif key == 'x':
            ok = _is_list(value, lambda s: _is_alnum(s, 1, 8))
        elif js.length(key) == 1:
            ok = _is_list(value, lambda s: _is_alnum(s, 2, 8))
        else:
            ok = _is_list(value, lambda s: _is_alnum(s, 3, 8))
        if not ok:
            return None
    built = {**locale, 'variants': list(locale['variants']), 'keywords': dict(locale['keywords'])}
    first = built['variants'][0] if built['variants'] else None
    if not built['script'] and not built['region'] and first and _FIRST_SCRIPT.match(first):
        built['script'] = _title(first[:4])
        built['variants'] = []
    return built


# ---------------------------------------------------------------------------
# Alias replacement (ICU's AliasReplacer), then the -t- and -u-rg/-u-sd
# keyword values. Returns the canonical locale, or None.


def _split_replacement(replacement):
    """A replacement as ICU splits it: language, then script, region, variant."""
    fields = replacement.split('-')
    r = {'language': fields[0], 'script': None, 'region': None, 'variant': None, 'extensions': None}
    i = 1
    if i < len(fields) and js.length(fields[i]) == 4 and _is_alpha(fields[i][0], 1, 1):
        r['script'] = fields[i]
        i += 1
    if i < len(fields) and fields[i] and 2 <= js.length(fields[i]) <= 3:
        r['region'] = fields[i]
        i += 1
    if i < len(fields) and fields[i] and js.length(fields[i]) >= 4:
        r['variant'] = fields[i]
        i += 1
    if i < len(fields):
        r['extensions'] = '-'.join(fields[i:])
    return r


def _delete_or_replace(input, type, replacement):
    if replacement:
        return replacement if input is None else input
    return input if type is None else None


def _replace_language(s, check_language, check_region, check_variants):
    if (check_region and not s['region']) or (check_variants and not s['variants']):
        return False
    rules = _tables()['rules']
    count = len(s['variants']) if check_variants else 1
    search_language = (s['language'] if s['language'] is not None else '') if check_language else 'und'
    search_region = s['region'] if check_region else None
    for i in range(count):
        search_variant = s['variants'][i] if check_variants else None
        if search_variant is not None and js.length(search_variant) < 4:
            search_variant = None
        key = '-'.join(f for f in (search_language, search_region, search_variant) if f is not None)
        if key not in rules:
            continue
        r = _split_replacement(rules[key])
        language = s['language'] if r['language'] == 'und' else r['language']
        script = _delete_or_replace(s['script'], None, r['script'])
        region = _delete_or_replace(s['region'], search_region, r['region'])
        variant = _delete_or_replace(search_variant, search_variant, r['variant'])
        if (language == s['language'] and script == s['script'] and region == s['region'] and
                variant == search_variant and r['extensions'] is None):
            continue
        s.update(language=language, script=script, region=region)
        if search_variant is not None:
            if variant:
                s['variants'][i] = variant
            else:
                del s['variants'][i]
        return True
    return False


def _replace_territory(s):
    """A region with several replacements becomes the language's likely region
    among them, else the first."""
    data = _tables()
    if not s['region'] or s['region'] not in data['regions']:
        return False
    by = data['regionChoices'].get(s['region'], {})
    language = s['language'] if s['language'] is not None else 'und'
    choice = (by.get(f"{language}-{s['script']}") if s['script'] else None) or by.get(language)
    s['region'] = choice if choice is not None else data['regions'][s['region']]
    return True


def _replace_script(s):
    scripts = _tables()['scripts']
    if not s['script'] or s['script'] not in scripts:
        return False
    s['script'] = scripts[s['script']]
    return True


def _replace_variant(s):
    data = _tables()
    for i, variant in enumerate(s['variants']):
        if variant not in data['variants'] or data['variants'][variant] == variant:
            continue
        s['variants'][i] = data['variants'][variant]
        for drop in data['variantDrops'].get(variant, []):
            # As JavaScript's splice() inside the loop: the entry after a removed one is skipped.
            j = 0
            while j < len(s['variants']):
                if s['variants'][j] == drop:
                    del s['variants'][j]
                j += 1
        return True
    return False


def _canonicalize_locale(locale):
    data = _tables()
    s = {
        'language': locale['language'] or None,
        'script': locale['script'] or None,
        'region': locale['region'] or None,
        'variants': [],
    }
    for v in locale['variants']:
        if v.lower() not in s['variants']:
            s['variants'].append(v.lower())
    s['variants'].sort()
    changed = 0
    while (_replace_language(s, True, True, True) or _replace_language(s, True, True, False) or
           _replace_language(s, True, False, True) or _replace_language(s, True, False, False) or
           _replace_language(s, False, False, True) or _replace_territory(s) or _replace_script(s) or
           _replace_variant(s)):
        changed += 1
        if changed > 50:
            return None
    if changed == 0 and len(s['variants']) <= 1 and not locale['keywords']:
        return locale
    keywords = dict(locale['keywords'])
    for key, value in locale['keywords'].items():
        if key in ('sd', 'rg') and value in data['subdivisions']:
            if data['subdivisions'][value]:
                keywords[key] = data['subdivisions'][value]
            else:
                del keywords[key]
        elif key == 't':
            transformed = _canonical_transformed(value)
            if transformed is None:
                return None
            keywords[key] = transformed
    result = {
        'language': s['language'] if s['language'] is not None else '',
        'script': s['script'] if s['script'] is not None else '',
        'region': s['region'] if s['region'] is not None else '',
        'variants': [v.upper() for v in sorted(s['variants'])],
        'keywords': keywords,
    }
    return result if _fits(result) else None


def _canonical_transformed(value):
    """-t-: the tlang canonicalized as a locale and lowercased, then the fields
    sorted (as written) with their values canonicalized."""
    subtags = value.split('-')
    k = next((n for n, s in enumerate(subtags) if _is_tkey(s)), len(subtags))
    output = []
    if k > 0:
        tlang = _for_language_tag('-'.join(subtags[:k]))
        if tlang:
            tlang = _build(tlang)
        if tlang:
            tlang = _canonicalize_locale(tlang)
        if not tlang:
            return None
        output.append(_language_tag(tlang).lower())
    fields = []
    while k < len(subtags):
        end = k + 1
        while end < len(subtags) and not _is_tkey(subtags[end]):
            end += 1
        if end == k + 1:
            return None
        fields.append('-'.join(subtags[k:end]))
        k = end
    tfields = _tables()['tfields']
    for field in sorted(fields):
        key, v = field[:2], field[3:]
        output.append(f"{key}-{tfields.get(key, {}).get(v, v)}")
    return '-'.join(output)


def _canonicalize(tag):
    """Intl.Locale: parse and build, canonicalize, build again, canonicalize again."""
    if not _starts_with_language_id(tag):
        return None
    locale = _for_language_tag(tag)
    for _ in range(2):
        if not locale:
            break
        locale = _build(locale)
        if locale:
            locale = _canonicalize_locale(locale)
    return locale


# ---------------------------------------------------------------------------
# Writing the tag back out.


def _base_subtags(locale):
    subtags = [locale['language'] or 'und']
    if locale['script']:
        subtags.append(locale['script'])
    if locale['region']:
        subtags.append(locale['region'])
    posix = '_'.join(locale['variants']) == 'POSIX'
    if not posix:
        variants = []
        for v in locale['variants']:
            if v.lower() not in variants:
                variants.append(v.lower())
        subtags.extend(sorted(variants))
    return subtags, posix


def _base_name(locale):
    subtags, posix = _base_subtags(locale)
    return '-'.join(subtags) + ('-u-va-posix' if posix else '')


def _rank(key):
    if key == 'x':
        return '~'
    if js.length(key) == 1:
        return key
    return 'u ' if key == 'attribute' else f'u-{key}'


def _language_tag(locale):
    """Singletons in order with the -u- keys (attributes first, then by key)
    where "u" sorts and private use last; a value of exactly "true" or "yes" is dropped."""
    subtags, posix = _base_subtags(locale)
    # A bare private-use tag ("und-x-...") is written as is.
    if (not locale['language'] and not locale['script'] and not locale['region'] and not locale['variants'] and
            len(locale['keywords']) == 1 and 'x' in locale['keywords']):
        return f"und-x-{locale['keywords']['x']}"
    keywords = dict(locale['keywords'])
    if posix and 'va' not in keywords:
        keywords['va'] = 'posix'
    out = list(subtags)
    unicode = False
    for key, value in sorted(keywords.items(), key=lambda kv: _rank(kv[0])):
        if js.length(key) > 1 and not unicode:
            out.append('u')
            unicode = True
        if key == 'attribute':
            out.append(value)
            continue
        out.append(key)
        if value not in ('true', 'yes'):
            out.append(value)
    return '-'.join(out)
