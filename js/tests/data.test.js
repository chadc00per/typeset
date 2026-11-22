// The pinned reference data in src/data/: its shape, and that every entry is accepted.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as types from '../src/index.js';
import currency from '../../data/currency.json' with { type: 'json' };
import geography from '../../data/geography.json' with { type: 'json' };
import emoji from '../../data/emoji.json' with { type: 'json' };

test('every data file records its version, source and the SHA-256 of each input', () => {
  for (const [file, data] of Object.entries({ currency, geography, emoji })) {
    assert.equal(typeof data.version, 'string', file);
    assert.match(data.source, /^https:\/\//, file);
    assert(Object.keys(data.sha256).length > 0, file);
    for (const [input, hash] of Object.entries(data.sha256)) assert.match(hash, /^[0-9a-f]{64}$/, `${file}: ${input}`);
  }
});

test('all pinned country, subdivision, and language entries are accepted', () => {
  const expand = text => text.split(' ').flatMap(token => {
    const [start, suffix] = token.split('~');
    if (!suffix) return [start];
    const first = start.charCodeAt(start.length - 1), last = suffix.charCodeAt(0);
    return Array.from({ length: last - first + 1 }, (_, i) => start.slice(0, -1) + String.fromCharCode(first + i));
  });
  const country = expand(geography.country), subdivisions = expand(geography.subdivision), languages = expand(geography.language);
  assert.equal(country.length, 257);
  assert.equal(subdivisions.length, 5027);
  assert.equal(languages.length, 7969);
  for (const code of country) assert.equal(types.Country.normalize(code), code);
  for (const code of subdivisions) {
    const formatted = `${code.slice(0, 2)}-${code.slice(2)}`.toUpperCase();
    assert.equal(types.Region.normalize(formatted), formatted);
  }
  for (const code of languages) {
    const canonical = types.Language.normalize(code);
    assert.equal(types.Language.normalize(canonical), canonical);
  }
});

test('geography data is pinned', () => {
  assert.equal(geography.version, 'CLDR 48');
});

test('every pinned emoji qualification maps to an idempotent complete emoji', () => {
  for (const [input, expected] of emoji.entries) {
    assert.equal(types.Emoji.normalize(input), expected);
    assert.equal(types.Emoji.normalize(expected), expected);
  }
});
