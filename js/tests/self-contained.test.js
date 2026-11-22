// The source runs anywhere: js/src/ imports only its own files, the declared
// dependencies and the shared data, and nothing Node-only reaches a browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';
import pkg from '../../package.json' with { type: 'json' };
import * as types from '../src/index.js';

const { dependencies, imports } = pkg;

const SRC = path.join(import.meta.dirname, '../src');
// The pinned reference data, shared with the Python package, ships beside src/.
const DATA = path.join(import.meta.dirname, '../../data');
const builtins = new Set(builtinModules.flatMap(n => [n, `node:${n}`]));
// The modules a browser never loads: package.json "imports" keeps vendor.node.js
// Node-only, and only the CommonJS build (scripts/build.js) takes vendor.require.js.
const NODE_ONLY = new Set(['lib/vendor.node.js', 'lib/vendor.require.js']);
// Every source module, as a path relative to src/.
const SOURCES = fs.readdirSync(SRC, { recursive: true }).filter(f => f.endsWith('.js')).map(f => f.split(path.sep).join('/'));

test('every import stays inside the package or names a builtin / declared dependency', () => {
  for (const file of SOURCES) {
    const source = fs.readFileSync(path.join(SRC, file), 'utf8');
    assert(!/\brequire\(['"]\.|module\.exports/.test(source), `${file}: CommonJS syntax in an ES module package`);
    for (const [, from, bare] of source.matchAll(/^(?:import|export)\s[^;]*?\bfrom\s+['"]([^'"]+)['"]|^import\s+['"]([^'"]+)['"]/gm)) {
      const name = from ?? bare;
      if (name.startsWith('.')) {
        const target = path.resolve(SRC, path.dirname(file), name);
        assert(target.startsWith(SRC + path.sep) || (target.startsWith(DATA + path.sep) && target.endsWith('.json')), `${file}: ${name} escapes the package`);
      } else if (name.startsWith('#')) {
        assert(Object.hasOwn(imports, name), `${file}: undeclared subpath import ${name}`);
      } else if (builtins.has(name)) {
        assert(NODE_ONLY.has(file), `${file}: Node builtin ${name} outside ${[...NODE_ONLY]}; the package runs in browsers too`);
      } else {
        // A subpath import (css-tree/parser) is of the package it names first.
        const packageName = name.split('/').slice(0, name.startsWith('@') ? 2 : 1).join('/');
        assert(Object.hasOwn(dependencies, packageName), `${file}: undeclared dependency ${name}`);
      }
    }
  }
});

test('no Node globals outside the Node-only module', () => {
  for (const file of SOURCES.filter(f => !NODE_ONLY.has(f))) {
    const source = fs.readFileSync(path.join(SRC, file), 'utf8');
    assert(!/\b(?:Buffer|process|__dirname|__filename|require)\b/.test(source.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')), `${file}: Node-only global`);
  }
});

test('catalog and constructors load from the package alone', () => {
  assert.equal(types.get('state'), types.get('region'));
  assert.equal(types.get('url').normalize('https://example.com'), 'https://example.com/');
  assert.equal(types.get('currency').normalize('usd'), 'USD');
  assert.equal(types.get('scopes').levelOf(['billing:write'], 'billing'), 'write');
  assert.deepEqual(types.describe().map(d => d.name), types.all);
  assert.equal(types.Email.normalize(' Ada@Example.com '), 'ada@example.com');
  assert.equal(types.Phone.normalize('212-555-0123'), '+12125550123');
  assert.throws(() => types.Email.normalize('nope'), e => e instanceof types.ValidationError && !(e instanceof TypeError));
});

test('str, num and bool are short names for the core types', () => {
  assert.deepEqual(
    [types.aliases.str, types.aliases.num, types.aliases.bool],
    ['string', 'number', 'boolean']
  );
  assert.equal(types.describe('str').name, 'string');
  assert.equal(types.describe('num').name, 'number');
  assert.equal(types.describe('bool').name, 'boolean');
  assert.deepEqual(types.describe('string').aliases, ['str']);
});
