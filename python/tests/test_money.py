"""Money.to_minor() / from_minor(): the same cases as js/tests/types/money.test.js."""
from __future__ import annotations

import pytest

from chadc00per_typeset import Money, ValidationError

PAIRS = [('12.5 usd', '1250', 'USD', '12.50'), ('KWD -1.005', '-1005', 'KWD', '-1.005'), ('JPY 1000', '1000', 'JPY', '1000'),
         ('0.07 USD', '7', 'USD', '0.07')]


@pytest.mark.parametrize(('value', 'minor', 'currency', 'amount'), PAIRS)
def test_converts_exactly_to_and_from_whole_minor_units(value, minor, currency, amount):
    assert Money.to_minor(value) == {'minor': minor, 'currency': currency}
    assert Money.from_minor({'minor': minor, 'currency': currency}) == {'amount': amount, 'currency': currency}


def test_ints_refusals_and_no_confusion_with_amounts():
    assert Money.from_minor({'minor': 1999, 'currency': 'usd'}) == {'amount': '19.99', 'currency': 'USD'}
    assert Money.from_minor({'minor': 10 ** 30, 'currency': 'JPY'})['amount'] == str(10 ** 30)
    for call, value, message in [
        (Money.to_minor, '12.505 USD', "money.amount must be a valid amount of money (finer than USD's minor unit)"),
        (Money.to_minor, 'XAU 1', 'money must be a valid amount of money (XAU has no minor unit)'),
        (Money.from_minor, {'minor': 1.5, 'currency': 'USD'}, 'money.minor must be a valid amount of money (whole minor units)'),
        (Money.from_minor, {'minor': True, 'currency': 'USD'}, 'money.minor must be a valid amount of money (whole minor units)'),
        (Money.from_minor, {'amount': 1999, 'currency': 'USD'}, 'money must be a valid amount of money ({ minor, currency })'),
    ]:
        with pytest.raises(ValidationError) as err:
            call(value)
        assert str(err.value) == message
    assert Money.is_({'minor': '1999', 'currency': 'USD'}) is False, 'a minor-units object is never read as an amount'
