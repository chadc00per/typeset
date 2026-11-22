#!/usr/bin/env node
// Writes the language-neutral contract every implementation is held to:
//   data/catalog.json               describe() for every type, in picker order
//                                   (Python builds its classes from it)
//   conformance/vectors/<type>.json what the JavaScript reference does with each input
//                                   (<type>.js.json for a type whose inputs differ by language):
//                            the canonical value, or the check() issues, and
//                            whether validate() takes the input as a stored value
// Inputs come from the JavaScript tests (recorded by tests/helpers.js), each
// type's example, and variations of all of those (case, padding, Unicode
// whitespace, decomposed text, near misses, wrong JSON kinds), so the vectors
// probe more than the tests assert. Regenerate after changing a type on purpose:
//   npm run conformance
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as typeset from '../src/index.js';
import { jsonSchemas, runtimeSpecific } from '../src/definitions.js';
import { exportName } from '../src/registry.js';
import { fromSpec, specs as STRUCT_SPECS } from './struct-cases.js';
import { decode, encode } from '../tests/helpers.js';

const ROOT = path.join(import.meta.dirname, '../..');
// The per-type test files, relative to ROOT (readdirSync: fs.globSync is experimental in Node 22).
const TYPE_TESTS = fs.readdirSync(path.join(ROOT, 'js/tests/types')).filter(f => f.endsWith('.test.js')).sort().map(f => `js/tests/types/${f}`);
const VECTORS = path.join(ROOT, 'conformance', 'vectors');
const CATALOG = path.join(ROOT, 'data', 'catalog.json');
// The clock relative inputs (expiry's "30d") resolve against, recorded in each file.
export const NOW = Date.parse('2026-01-15T12:00:00.000Z');
// An input larger than this (as JSON) is kept only if a test used it, and never varied.
const MAX_VARIED = 1024;

// 1. The inputs the tests use.
const log = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'typeset-conformance-')), 'inputs.ndjson');
fs.writeFileSync(log, '');
execFileSync(process.execPath, ['--test', '--test-reporter=dot', ...TYPE_TESTS],
  { cwd: ROOT, env: { ...process.env, TYPESET_RECORD: log }, stdio: ['ignore', 'ignore', 'inherit'] });
const inputs = new Map(typeset.names.map(name => [name, new Map()]));
const add = (name, value) => {
  let key;
  try { key = JSON.stringify(encode(value)); } catch { return; }
  if (key !== undefined && !inputs.get(name).has(key)) inputs.get(name).set(key, JSON.parse(key));
};
for (const line of fs.readFileSync(log, 'utf8').split('\n').filter(Boolean)) {
  const { type, input } = JSON.parse(line);
  if (inputs.has(type)) inputs.get(type).set(JSON.stringify(input), input);
}

// Literal arguments of Type(...) / Type.normalize(...) / Type.is(...) / Type.check(...) in the tests.
const ctorNames = new Map(typeset.names.map(name => [typeset.get(name).name, name]));
for (const file of TYPE_TESTS) {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const [, ctor, literal] of source.matchAll(/\b([A-Z][A-Za-z0-9]*)(?:\.(?:normalize|is|check))?\(\s*('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|-?\d+(?:\.\d+)?(?:e-?\d+)?)\s*[,)]/g)) {
    const exported = typeset[ctor];
    if (!exported || !ctorNames.has(exported.name)) continue;
    try { add(exported.name, literal.startsWith("'") ? eval(literal) : JSON.parse(literal)); } catch { /* not a plain literal */ }
  }
}

// 2. Variations.
const GENERIC = ['', ' ', 'a', 'x'.repeat(300), null, true, false, 0, 1, -1, 1.5, 1e21, [], {}, ['a'], { a: 1 }, NaN, Infinity, -0];
function variations(value) {
  const out = [];
  if (typeof value === 'string') {
    out.push(value.toUpperCase(), value.toLowerCase(), ` ${value} `, `\t${value}`, `${value}\n`, `\u00a0${value}\u00a0`,
      `\ufeff${value}`, `${value}\u2028`, `${value}x`, value.slice(0, -1), value.slice(1), value.normalize('NFD'), value.replace(/ /g, '  '));
    const n = Number(value);
    if (value.trim() && Number.isFinite(n)) out.push(n);
  } else if (typeof value === 'number' && Number.isFinite(value)) {
    out.push(String(value), value + 1, -value, value * 1000, value / 7, ` ${value} `);
  } else if (Array.isArray(value)) {
    out.push(value.slice(1), [...value, value[0]], [...value].reverse(), value.join(','), value.join(', '), [value]);
  } else if (value && typeof value === 'object') {
    out.push(JSON.stringify(value), { ...value, extra: 1 }, Object.fromEntries(Object.entries(value).slice(1)));
  }
  return out;
}

// 3. The reference's answer for each input, on the fixed clock.
Date.now = () => NOW;
const reference = name => typeset.get(name);
function answer(Type, input) {
  const value = decode(input);
  const result = Type.check(value);
  const entry = { input };
  if (result.ok) entry.output = encode(result.value);
  else entry.issues = result.issues;
  try { Type.validate(value); entry.stored = true; } catch (err) {
    if (!(err instanceof typeset.ValidationError)) throw err;
    entry.stored = false;
  }
  return entry;
}

// A runtime-specific type's vectors hold only JavaScript's answers, so they are named for it.
const vectorFile = name => (Object.hasOwn(runtimeSpecific, name) ? `${name}.js.json` : `${name}.json`);

fs.rmSync(VECTORS, { recursive: true, force: true });
fs.mkdirSync(VECTORS, { recursive: true });
let total = 0;
for (const name of typeset.names) {
  const Type = reference(name);
  const seeds = inputs.get(name);
  add(name, Type.describe().example);
  try { add(name, JSON.parse(Type.describe().example)); } catch { /* not JSON */ }
  for (const option of Type.describe().ui.options ?? []) add(name, option);
  // Canonical outputs are inputs too: they must be fixed points everywhere.
  for (const value of [...seeds.values()]) {
    const result = Type.check(decode(value));
    if (result.ok) add(name, result.value);
  }
  for (const value of [...seeds.values()]) {
    if (JSON.stringify(value).length <= MAX_VARIED) for (const variant of variations(decode(value))) add(name, variant);
  }
  for (const value of GENERIC) add(name, value);
  const cases = [...seeds.values()].map(input => answer(Type, input));
  total += cases.length;
  // One case per line, so a diff shows exactly which answers changed.
  fs.writeFileSync(path.join(VECTORS, vectorFile(name)), `{"type":${JSON.stringify(name)},"now":${NOW},"cases":[\n${cases.map(c => JSON.stringify(c)).join(',\n')}\n]}\n`);
}
fs.writeFileSync(CATALOG, JSON.stringify({
  aliases: typeset.aliases,
  // The types whose accepted inputs differ by language (their vectors are JavaScript's
  // alone), with what each other language describes differently.
  runtimeSpecific,
  // Each semantic type's constructor name, in picker order.
  constructors: Object.fromEntries(typeset.names.map(name => [name, exportName(name)])),
  types: typeset.describe(),
  // What toJSONSchema() adds to each type's storage schema, and every type's full schema:
  // Python builds its schemas from the first and is checked against the second.
  jsonSchemas,
  schemas: Object.fromEntries(typeset.all.map(name => [name, typeset.toJSONSchema(name)]))
}, null, 1) + '\n');
// A refusal's message, or undefined when the call goes through.
function threw(call) {
  try { call(); return undefined; } catch (err) { if (err instanceof typeset.ValidationError) return err.message; throw err; }
}

// struct(): each spec's answer for each input (every issue, and the thrown message), and
// whether validate() takes the input as a stored value.
const structCases = STRUCT_SPECS.map(({ inputs, ...spec }) => {
  const Struct = fromSpec(spec);
  return { ...spec, cases: inputs.map(raw => {
    const input = encode(raw);
    const result = Struct.check(decode(input));
    // A canonical output must pass as a stored value (`canonical`), the input need not (`stored`).
    const answer = result.ok
      ? { input, output: encode(result.value), canonical: threw(() => Struct.validate(result.value)) ?? true }
      : { input, issues: result.issues, message: threw(() => Struct.normalize(decode(input))) };
    return { ...answer, stored: threw(() => Struct.validate(decode(input))) ?? true };
  }) };
});
fs.writeFileSync(path.join(ROOT, 'conformance', 'struct.json'), `{"specs":[\n${structCases.map(c => JSON.stringify(c)).join(',\n')}\n]}\n`);
console.log(`data/catalog.json: ${typeset.all.length} types described; conformance/vectors/: ${total} vectors over ${typeset.names.length} types; conformance/struct.json: ${structCases.reduce((n, c) => n + c.cases.length, 0)} struct cases`);
