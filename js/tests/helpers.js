// Table-driven assertions shared by the per-module tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ValidationError } from '../src/index.js';

// With TYPESET_RECORD set (scripts/generate-conformance.js), every input a test hands
// these helpers is appended to that file, so the conformance vectors in conformance/
// cover everything the JavaScript tests do.
function record(Type, values) {
  if (!process.env.TYPESET_RECORD) return;
  const lines = values.map(value => {
    try { return JSON.stringify({ type: Type.name, input: encode(value) }); } catch { return null; }
  }).filter(Boolean);
  if (lines.length) fs.appendFileSync(process.env.TYPESET_RECORD, lines.join('\n') + '\n');
}
// JSON, with the numbers JSON lacks spelled { "$js": "NaN" | "Infinity" | "-Infinity" | "-0" }
// and a Date as { "$js": "Date", "value": epoch ms }. Anything else JSON can't carry
// (bigint, undefined, a RegExp, a sparse array) is not recorded.
export function encode(value) {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return { $js: 'NaN' };
    if (value === Infinity) return { $js: 'Infinity' };
    if (value === -Infinity) return { $js: '-Infinity' };
    if (Object.is(value, -0)) return { $js: '-0' };
    return value;
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (value instanceof Date) return { $js: 'Date', value: value.getTime() };
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError('exotic array');
    return Array.from({ length: value.length }, (_, i) => { if (!Object.hasOwn(value, i)) throw new TypeError('sparse'); return encode(value[i]); });
  }
  if (typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) throw new TypeError('exotic object');
    if (Object.hasOwn(value, '$js')) throw new TypeError('reserved key');
    return Object.fromEntries(Object.keys(value).map(key => [key, encode(value[key])]));
  }
  throw new TypeError(`unencodable ${typeof value}`);
}

// encode()'s inverse.
export function decode(value) {
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === 'object') {
    if (Object.hasOwn(value, '$js')) return value.$js === 'Date' ? new Date(value.value) : { NaN, Infinity, '-Infinity': -Infinity, '-0': -0 }[value.$js];
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decode(v)]));
  }
  return value;
}

// Each [input, canonical] pair normalizes to its canonical value, and the
// canonical value is a fixed point (normalizing it again changes nothing).
export function accepts(Type, pairs) {
  record(Type, pairs.flat());
  for (const [input, canonical] of pairs) {
    assert.deepEqual(Type.normalize(input), canonical, `${Type.name}: ${JSON.stringify(input)}`);
    assert.deepEqual(Type.normalize(canonical), canonical, `${Type.name}: ${JSON.stringify(canonical)} is not a fixed point`);
  }
}

// Each input is refused with a ValidationError (a refusal, not a bug).
export function refuses(Type, inputs) {
  record(Type, inputs);
  for (const input of inputs) {
    assert.throws(() => Type.normalize(input), e => e instanceof ValidationError, `${Type.name} accepted ${JSON.stringify(input)}`);
  }
}
