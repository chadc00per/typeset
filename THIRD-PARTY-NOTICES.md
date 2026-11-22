# Third-party notices

@chadc00per/typeset is licensed under the Apache License 2.0 (see `LICENSE` and
`NOTICE`). It also contains the following third-party material, which stays
under its own license.

## @hapi/address — BSD-3-Clause

`js/src/types/email.js` (`validAddress`, `validDomain` and their regular expressions)
is ported from @hapi/address 5 (https://github.com/hapijs/address).

```
Copyright (c) 2019-2022, Sideway, Inc. and Project contributors
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 * The names of any contributors may not be used to endorse or promote
   products derived from this software without specific prior written
   permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS AND CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

## Node.js — MIT

The IPv4/IPv6 regular expressions in `js/src/lib/ip.js` follow the `isIP`
grammar in Node.js `lib/internal/net.js` (https://github.com/nodejs/node).

```
Copyright Node.js contributors. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
```

## Unicode CLDR and Unicode emoji data — Unicode-3.0

`data/geography.json` (CLDR 48 validity tables) and `data/emoji.json`
(Unicode Emoji 17.0, `emoji-test.txt`) are derived from Unicode, Inc. data
files under the Unicode License v3; the full notice is in
`data/UNICODE-LICENSE.txt`.

## ISO 4217 currency codes

`data/currency.json` lists the current ISO 4217 currency codes and their
minor units, taken from list one published by the ISO 4217 maintenance agency
(SIX Group). It is not Unicode data and is not covered by the Unicode License.

## Runtime dependencies

These are installed from npm, not copied into this package, and carry their
own license files: `google-libphonenumber` (MIT; bundles Google libphonenumber
and the Closure Library under Apache-2.0) and the code types' parsers, `acorn`
(MIT), `parse5` (MIT, with `entities`, BSD-2-Clause), `css-tree` (MIT), `saxes`
(ISC, with `xmlchars`, MIT) and `@lezer/python` (MIT, with `@lezer/common`,
`@lezer/lr` and `@lezer/highlight`, MIT). An application that bundles this
package for the browser also bundles them and should carry their notices;
`js/dist/THIRD-PARTY-LICENSES.txt` holds every one. The Python package depends on
`ada-url` (Apache-2.0 / MIT, the URL parser Node itself uses) and `regress` (MIT /
Apache-2.0, an ECMAScript regular expression engine), and its optional extras on
`phonenumbers` (Apache-2.0, a port of the same library; `[phone]`) and `mini-racer`
(ISC, embedding V8, BSD-3-Clause; `[code]`).

The Python package does copy the parsers above: `_parsers.js` bundles them, and
their license texts ship beside it in `_parsers.LICENSES.txt`.

`data/tlds.json` is the top-level domain list from `@hapi/tlds` (BSD-3-Clause,
© 2019-2022 Sideway, Inc. and Project contributors), itself the IANA root zone
list, under the same BSD-3-Clause terms as @hapi/address above.
`data/timezones.json`, `data/languages.json` and `data/locales.json` record
ICU's answers (Unicode-3.0, see `data/UNICODE-LICENSE.txt`) for zone,
language and locale names.
