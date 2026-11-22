// Every way the package is loaded: `import` and `require()` in Node, the
// CommonJS build that tooling without require(esm) reads, the self-contained
// browser module and classic script, and rendering values with React.
// dist/ is built by `npm run build` (npm test runs it first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { parse } from 'acorn';
import { createElement as h } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import * as esm from '@chadc00per/typeset';

const require = createRequire(import.meta.url);
const DIST = path.join(import.meta.dirname, '../dist');

// The types a lite build leaves out.
const OMITTED = ['Phone', 'Fn', 'JavaScript', 'Python', 'Html', 'Css', 'Svg'];

// The same answers from every build, including the lazily loaded phone data. A lite
// build's omitted types throw a TypeError on every call, whatever the input: a build
// mistake that is() and check() rethrow, never a refusal of junk input.
function exercise(types, { lite = false } = {}) {
  assert.equal(types.Email(' Ada@Example.com '), 'ada@example.com');
  // (by name: the classic script runs in its own realm, with its own TypeError)
  const unavailable = e => e.name === 'TypeError' && /lite build leaves out/.test(e.message);
  if (lite) {
    for (const name of OMITTED) {
      const Type = types[name];
      for (const input of ['212-555-0123', 'x => x', 'junk', '', 42, null]) {
        for (const call of [() => Type(input), () => Type.normalize(input), () => Type.is(input), () => Type.check(input), () => Type.validate(input), () => Type['~standard'].validate(input)]) {
          assert.throws(call, unavailable, `${name}(${JSON.stringify(input)})`);
        }
      }
      assert.equal(types.describe(Type.name).name, Type.name, 'an omitted type is still described');
    }
  } else assert.equal(types.Phone('212-555-0123'), '+12125550123');
  assert.equal(types.Integer('42') + 1, 43);
  assert.deepEqual([...types.TagSet(['B', 'a', 'a'])], ['a', 'b']);
  assert.equal(types.Emoji('😄'), '😄');
  assert.equal(types.Country('us'), 'US');
  assert.equal(types.Currency('usd'), 'USD');
  assert.equal(types.typeOf(types.TagSet(['a'])), 'tagset');
  assert.equal(types.Email.is('ada@example.invalidtld'), false);
  assert.equal(types.describe('email').ui.control, 'email');
  assert.throws(() => types.Email('nope'), e => e.name === 'ValidationError' && e instanceof types.ValidationError);
}

test('import and require() in Node load one copy of the package', () => {
  const required = require('@chadc00per/typeset');
  exercise(esm);
  // "module-sync": require() takes the ES module itself, so the types and the error class are shared
  assert.equal(required.Email, esm.Email);
  assert.equal(required.ValidationError, esm.ValidationError);
  assert.equal(required.typeOf(esm.TagSet(['a'])), 'tagset');
});

test('the CommonJS build works under a plain CommonJS loader', () => {
  const cjs = require(path.join(DIST, 'index.cjs'));
  exercise(cjs);
  // a second copy: the values are plain, so each copy reads the other's; typeOf()
  // and instanceof ValidationError are per copy
  assert.equal(esm.Email(cjs.Email('Ada@example.com')), 'ada@example.com');
  assert.equal(esm.typeOf(cjs.TagSet(['a'])), 'object');
  const source = fs.readFileSync(path.join(DIST, 'index.cjs'), 'utf8');
  assert(!/\bimport\.meta\b|^\s*(?:import|export)\s/m.test(source), 'ES module syntax in the CommonJS build');
});

for (const file of ['typeset.browser.js', 'typeset.browser-lite.js']) test(`${file}: needs no bundler, import map or Node API`, async () => {
  const source = fs.readFileSync(path.join(DIST, file), 'utf8');
  // Parsed, not pattern-matched: the bundled parser's own code spells "from" and "import(".
  const specifiers = [];
  (function walk(node) {
    if (!node || typeof node.type !== 'string') return;
    if (node.source && /^(?:Import|Export(?:Named|All))Declaration$|^ImportExpression$/.test(node.type)) specifiers.push(node.source.value ?? '(computed)');
    for (const child of Object.values(node)) for (const item of Array.isArray(child) ? child : [child]) if (item && typeof item === 'object') walk(item);
  })(parse(source, { ecmaVersion: 'latest', sourceType: 'module' }));
  assert.deepEqual(specifiers.filter(s => !/^\.\.?\//.test(s)), [], 'bare import left in the browser module');
  assert(!/\brequire\s*\(\s*["']/.test(source), 'require() left in the browser module');
  exercise(await import(pathToFileURL(path.join(DIST, file))), { lite: file.includes('lite') });
});

for (const file of ['typeset.global.js', 'typeset.global-lite.js']) test(`${file}: defines window.Typeset with only web globals`, () => {
  const source = fs.readFileSync(path.join(DIST, file), 'utf8');
  // a bare realm plus the web APIs a browser has; no require, process, module or Buffer
  const window = { TextEncoder, URL, structuredClone };
  window.window = window;
  vm.runInNewContext(source, window);
  exercise(window.Typeset, { lite: file.includes('lite') });
});

test('the lite builds stand in for every vendor function, bundle no third-party code, and describe the same catalog', async () => {
  const names = file => Object.keys(Object.fromEntries([...fs.readFileSync(path.join(import.meta.dirname, '../src/lib', file), 'utf8')
    .matchAll(/^export \{([^}]*)\}/gm)].flatMap(([, list]) => list.split(',').map(n => [n.trim(), true]))));
  assert.deepEqual(names('vendor.lite.js').sort(), names('vendor.js').sort(), 'vendor.lite.js must stand in for each vendor.js export');
  const lite = await import(pathToFileURL(path.join(DIST, 'typeset.browser-lite.js')));
  assert.deepEqual(lite.describe(), esm.describe());
  assert.throws(() => lite.Fn.check('() => 1'), e => e instanceof TypeError && /needs acorn/.test(e.message));
  assert.throws(() => lite.Phone.is('junk'), e => e instanceof TypeError && /needs google-libphonenumber/.test(e.message));
  const full = fs.statSync(path.join(DIST, 'typeset.browser.js')).size, small = fs.statSync(path.join(DIST, 'typeset.browser-lite.js')).size;
  assert(small < full / 2, `lite build is ${small} bytes, full ${full}`);
});

test('React renders values directly: they are plain strings, numbers and arrays', () => {
  const { Email, Integer, Percentage, TagSet } = esm;
  const email = Email('Ada@Example.com');
  assert.equal(renderToStaticMarkup(h('p', null, email)), '<p>ada@example.com</p>');
  assert.equal(renderToString(h('p', null, email)), '<p>ada@example.com</p>');
  assert.equal(renderToStaticMarkup(h('input', { value: email, readOnly: true })), '<input readOnly="" value="ada@example.com"/>');
  assert.equal(renderToStaticMarkup(h('p', null, Integer('42'))), '<p>42</p>');
  assert.equal(renderToStaticMarkup(h('p', null, Percentage('25%'))), '<p>25</p>');
  assert.equal(renderToStaticMarkup(h('ul', null, TagSet(['b', 'a']).map(tag => h('li', { key: tag }, tag)))), '<ul><li>a</li><li>b</li></ul>');
});

test('package.json points every entry at a file that ships', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../../package.json'), 'utf8'));
  const targets = [pkg.main, pkg.module, pkg.types, pkg.unpkg, pkg.jsdelivr];
  const walk = value => typeof value === 'string' ? targets.push(value) : Object.values(value).forEach(walk);
  walk(pkg.exports);
  for (const target of targets) {
    assert(fs.existsSync(path.join(import.meta.dirname, '../..', target)), `${target} is missing`);
    assert(pkg.files.some(dir => target.replace(/^\.\//, '').startsWith(dir)) || target === './package.json', `${target} is not in "files"`);
  }
});
