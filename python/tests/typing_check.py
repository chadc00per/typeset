"""Static-only use of the stubs (__init__.pyi), checked by mypy --strict in CI and by
`npm run lint:python`; never run. Like js/tests/typings.check.ts for the JavaScript typings."""
from __future__ import annotations

from typing import Any

import chadc00per_typeset as typeset
from chadc00per_typeset import Email, Money

result = Email.check('x')
if result['ok']:
    value: str = result['value']
else:
    code: str = result['issues'][0]['code']
money = Money.normalize('1 usd')
amount: str = money['amount']
meta = typeset.describe('email')
label: str = meta['label'] if meta is not None else ''
schema = typeset.to_json_schema('email')

# struct(): a whole object; check() lists every issue.
User = typeset.struct({'email': typeset.Email, 'zip': 'postalcode'}, optional=['zip'])
user_check = User.check({'email': 'a@b.co'})
if not user_check['ok']:
    struct_issues: list[typeset.Issue] = user_check['issues']
user_schema: dict[str, Any] | None = typeset.to_json_schema(User)
email_schema: dict[str, Any] = typeset.Email.to_json_schema()
