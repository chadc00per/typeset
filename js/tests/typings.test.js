// index.d.ts is written by hand; these keep it in step with the runtime.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as types from '../src/index.js';

const dts = fs.readFileSync(path.join(import.meta.dirname, '../src/index.d.ts'), 'utf8');
const union = name => {
  const match = new RegExp(`export type ${name} = ([^;]+);`).exec(dts);
  assert(match, `no ${name} in index.d.ts`);
  return [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1]).sort();
};

test('every constructor export is declared with its type name', () => {
  const declared = Object.fromEntries([...dts.matchAll(/^export const (\w+): Type<'(\w+)'>;$/gm)].map(m => [m[1], m[2]]));
  const exported = Object.fromEntries(Object.entries(types).filter(([key]) => /^[A-Z]/.test(key) && key !== 'ValidationError').map(([key, Type]) => [key, Type.name]));
  assert.deepEqual(declared, exported);
});

test('the type-name unions cover the semantic types by storage', () => {
  const byStorage = storage => types.names.filter(name => types.describe(name).storage === storage).sort();
  assert.deepEqual(union('SemanticStringType'), byStorage('string'));
  assert.deepEqual(union('SemanticNumberType'), byStorage('number'));
  assert.deepEqual(union('SemanticArrayType'), byStorage('array'));
  assert.deepEqual(union('SemanticObjectType'), byStorage('object'));
});

test('CoreTypeName lists the core types', () => {
  assert.deepEqual(union('CoreTypeName'), types.all.filter(name => !types.names.includes(name)).sort());
});

test('the declared aliases match', () => {
  const match = /export const aliases: Readonly<\{([^}]+)\}>/.exec(dts);
  const declared = Object.fromEntries([...match[1].matchAll(/(\w+): '(\w+)'/g)].map(m => [m[1], m[2]]));
  assert.deepEqual(declared, { ...types.aliases });
});

// is() narrows its input to TypeInputs[T], so that must cover every kind of input the
// type accepts, or a true answer would narrow a value to a type it isn't.
test('TypeInputs covers every kind of input each type accepts', () => {
  const block = /export interface TypeInputs \{([^}]+)\}/.exec(dts)[1];
  const declared = Object.fromEntries([...block.matchAll(/^\s+'?(\w+)'?: ([^;]+);$/gm)].map(([, name, type]) => [name, type]));
  assert.deepEqual(Object.keys(declared).sort(), [...types.names].sort());
  const kindOf = value => value === null ? 'null' : Array.isArray(value) ? 'readonly unknown[]' : value?.$js === 'Date' ? 'Date' : value?.$js ? 'number' : typeof value;
  const covers = (type, kind) => type.split(' | ').some(part => part === kind || (kind === 'object' && part === 'object'));
  for (const name of types.names) {
    const file = path.join(import.meta.dirname, '../../conformance/vectors', fs.existsSync(path.join(import.meta.dirname, `../../conformance/vectors/${name}.json`)) ? `${name}.json` : `${name}.js.json`);
    for (const { input, output } of JSON.parse(fs.readFileSync(file, 'utf8')).cases) {
      if (output !== undefined) assert(covers(declared[name], kindOf(input)), `${name} accepts ${kindOf(input)}, but TypeInputs says ${declared[name]}`);
    }
  }
  // Kinds JSON vectors can't hold.
  assert.equal(types.Regex.is(/a/), true);
  assert.match(declared.regex, /RegExp/);
  assert.equal(types.Fn.is(() => 1), true);
  assert.match(declared.function, /=>/);
  assert.equal(types.Decimal.is(1n), true);
  assert.match(declared.decimal, /bigint/);
  assert.equal(types.Expiry.is(new Date(0)), true);
  assert.match(declared.expiry, /Date/);
});
