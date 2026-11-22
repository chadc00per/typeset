"""Python ints are exact where JavaScript numbers aren't: every int outside the
safe range is read as the double JavaScript would hold (lib/js.py js_value), so
huge ints are refused like Infinity rather than overflowing, and unsafe ones
round as they do in JS."""
from __future__ import annotations

import pytest

import chadc00per_typeset as typeset

HUGE = 10**400


@pytest.mark.parametrize('name, value', [
    ('year', HUGE), ('expiry', HUGE), ('interval', HUGE), ('phone', HUGE), ('integer', -HUGE),
    ('datetimewindow', [HUGE, 1]), ('geo', [HUGE, 1]), ('xy', [1, HUGE]),
    ('geojson', {'type': 'Point', 'coordinates': [HUGE, 0]}),
])
def test_huge_ints_are_refused_not_raised(name, value):
    assert typeset.get(name).check(value)['ok'] is False


def test_unsafe_ints_round_as_javascript_reads_them():
    assert typeset.Decimal.normalize(2**53 + 1) == '9007199254740992'
    assert typeset.Decimal.normalize(2**64) == '18446744073709552000'
    assert typeset.Multiplier.normalize(2**53 + 1) == 2**53
    typeset.Multiplier.validate(2**53 + 1)  # the same double as 2**53, as in JS


def test_lone_surrogates_are_refused_but_a_split_pair_is_one_character():
    assert not typeset.Tag.is_('a\ud800')
    assert not typeset.Css.is_('p {} /* \udc00 */')
    assert typeset.Css.is_('p {} /* \ud83d\ude00 */')  # a pair held as two code points, as JSON can decode it
