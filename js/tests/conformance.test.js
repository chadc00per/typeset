// The language-neutral contract (data/catalog.json and conformance/vectors/,
// written by scripts/generate-conformance.js) is what every implementation is
// held to, Python included. These tests keep it in step with this package: a
// change to a type's behavior or metadata fails here until
// `npm run conformance` regenerates it and the change is reviewed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as typeset from '../src/index.js';
import { jsonSchemas, runtimeSpecific } from '../src/definitions.js';
import { exportName } from '../src/registry.js';
import { decode, encode } from './helpers.js';

const ROOT = path.join(import.meta.dirname, '../..');
const read = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
// A type whose inputs differ by language has JavaScript's vectors alone, named for it.
const vectorFile = name => (Object.hasOwn(runtimeSpecific, name) ? `${name}.js.json` : `${name}.json`);

test('data/catalog.json is describe(), the aliases, the constructor names, the runtime-specific types and the JSON Schemas', () => {
  const catalog = read('data/catalog.json');
  assert.deepEqual(catalog.types, typeset.describe());
  assert.deepEqual(catalog.runtimeSpecific, runtimeSpecific);
  assert.deepEqual(catalog.aliases, typeset.aliases);
  assert.deepEqual(catalog.constructors, Object.fromEntries(typeset.names.map(name => [name, exportName(name)])));
  assert.deepEqual(catalog.jsonSchemas, jsonSchemas);
  assert.deepEqual(catalog.schemas, Object.fromEntries(typeset.all.map(name => [name, typeset.toJSONSchema(name)])));
});

test('every semantic type has vectors, and none for anything else', () => {
  const files = fs.readdirSync(path.join(ROOT, 'conformance', 'vectors')).sort();
  assert.deepEqual(files, typeset.names.map(vectorFile).sort());
});

for (const name of typeset.names) {
  test(`${name}: answers its conformance vectors`, t => {
    const Type = typeset.get(name);
    const { now, cases } = read(`conformance/vectors/${vectorFile(name)}`);
    const clock = Date.now;
    Date.now = () => now; // relative inputs (expiry's "30d") resolve against the vectors' clock
    t.after(() => { Date.now = clock; });
    for (const { input, output, issues, stored } of cases) {
      const value = decode(input);
      const result = Type.check(value);
      if (output !== undefined) assert.deepEqual(result, { ok: true, value: output }, JSON.stringify(input));
      else assert.deepEqual(result, { ok: false, issues }, JSON.stringify(input));
      let valid = true;
      try { Type.validate(value); } catch { valid = false; }
      assert.equal(valid, stored, `validate(${JSON.stringify(input)})`);
      if (result.ok) assert.deepEqual(encode(result.value), output);
    }
  });
}

test('struct(): answers conformance/struct.json', async () => {
  const { fromSpec } = await import('../scripts/struct-cases.js');
  const threw = call => { try { call(); return undefined; } catch (err) { if (err instanceof typeset.ValidationError) return err.message; throw err; } };
  for (const { cases, ...spec } of read('conformance/struct.json').specs) {
    const Struct = fromSpec(spec);
    for (const { input, output, canonical, issues, message, stored } of cases) {
      const shown = JSON.stringify(input);
      const result = Struct.check(decode(input));
      if (output !== undefined) {
        assert.deepEqual(encode(result.value), output, shown);
        assert.equal(threw(() => Struct.validate(result.value)) ?? true, canonical, `validate(output of ${shown})`);
      } else {
        assert.deepEqual(result, { ok: false, issues }, shown);
        assert.equal(threw(() => Struct.normalize(decode(input))), message, `normalize(${shown})`);
      }
      assert.equal(threw(() => Struct.validate(decode(input))) ?? true, stored, `validate(${shown})`);
    }
  }
});
