// The README's examples and TYPES.md's samples, run, so the docs can't drift from the code.
//   ```js blocks run as ES modules (the package import points at js/src). A line ending in
//     `// → value` checks the expression before it deep-equals `value`; `// → throws Name: message`
//     checks it throws that error.
//   ```ts and ```tsx blocks are type-checked, strict.
//   TYPES.md: each row's `input` → `stored` sample is normalize()'s answer.
// python/tests/test_readme.py runs the ```python blocks and the same TYPES.md rows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import * as typeset from '../src/index.js';

const ROOT = path.join(import.meta.dirname, '../..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const ENTRY = pathToFileURL(path.join(ROOT, 'js/src/index.js')).href;

// Each fenced block of a language: { code, line } (line: where the block starts in the file).
export function blocks(markdown, languages) {
  const out = [];
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const open = /^```(\w+)\s*$/.exec(lines[i]);
    if (!open) continue;
    const start = i + 1;
    while (i + 1 < lines.length && lines[i + 1] !== '```') i++;
    if (languages.includes(open[1])) out.push({ language: open[1], code: lines.slice(start, i + 1).join('\n'), line: start + 1 });
    i++;
  }
  return out;
}

// A js block as a runnable module: the package import points at js/src, and each `// →` line
// becomes a check.
function runnable({ code, line }) {
  const body = code.split('\n').map((text, i) => {
    const arrow = /^(\s*)(.+?);?\s*\/\/ → (.+)$/.exec(text);
    if (!arrow) return text;
    const [, indent, expression, expected] = arrow;
    const at = line + i;
    const thrown = /^throws (\w+): (.+)$/.exec(expected);
    if (thrown) return `${indent}__throws(() => { ${expression}; }, ${JSON.stringify(thrown[1])}, ${JSON.stringify(thrown[2])}, ${at});`;
    return `${indent}__check(() => (${expression}), () => (${expected}), ${at});`;
  }).join('\n');
  return body.replaceAll("from '@chadc00per/typeset'", `from ${JSON.stringify(ENTRY)}`);
}

globalThis.__check = (actual, expected, line) => assert.deepStrictEqual(actual(), expected(), `README.md:${line}`);
globalThis.__throws = (call, name, message, line) => assert.throws(call, { name, message }, `README.md:${line}`);

test('README.md: every js example runs and every → result holds', async () => {
  const examples = blocks(read('README.md'), ['js']);
  assert(examples.length >= 8, 'README.md lost its examples');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'typeset-readme-'));
  try {
    for (const example of examples) {
      const file = path.join(dir, `line-${example.line}.mjs`);
      fs.writeFileSync(file, runnable(example));
      await import(pathToFileURL(file).href);
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  // Every → line was turned into a check.
  const arrows = examples.reduce((n, { code }) => n + (code.match(/\/\/ → /g) ?? []).length, 0);
  assert(arrows >= 30, `only ${arrows} checked results`);
});

test('README.md: every ts and tsx example type-checks, strict', () => {
  const examples = blocks(read('README.md'), ['ts', 'tsx']);
  assert(examples.length >= 3);
  // Inside the package, so its own name resolves through package.json "exports".
  const dir = fs.mkdtempSync(path.join(import.meta.dirname, '.readme-'));
  try {
    const files = examples.map(({ language, code, line }) => {
      const file = path.join(dir, `line-${line}.${language}`);
      fs.writeFileSync(file, code);
      return file;
    });
    const program = ts.createProgram(files, {
      strict: true, noEmit: true, noUncheckedIndexedAccess: false, jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, target: ts.ScriptTarget.ES2022, skipLibCheck: true
    });
    const problems = ts.getPreEmitDiagnostics(program).map(d => `${path.basename(d.file?.fileName ?? '')}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
    assert.deepEqual(problems, []);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// TYPES.md's rows: `Constructor` | `name` | value | `input` → `stored`, … | rules.
export function samples(markdown) {
  const out = [];
  for (const row of markdown.split('\n').filter(l => /^\| `[A-Z]/.test(l))) {
    const cells = row.slice(1, -1).split(/(?<!\\)\|/).map(c => c.trim().replaceAll('\\|', '|'));
    const name = /`(\w+)`/.exec(cells[1])[1];
    for (const pair of cells[3].split(/(?<=`), (?=`)/)) {
      const m = /^`(.+)` → (?:`(.+)`|(same|unchanged|the object))(.*)$/.exec(pair);
      if (!m || m[4]) continue; // "same, with …": described, not a literal
      out.push({ name, input: m[1], stored: m[2] ?? (m[3] === 'the object' ? `JSON.parse(${m[1]})` : m[1]) });
    }
  }
  return out;
}

test('TYPES.md: every sample normalizes to its stored value', () => {
  const rows = samples(read('TYPES.md'));
  assert(rows.length >= 95, `only ${rows.length} samples`);
  for (const { name, input, stored } of rows) {
    // The samples are JavaScript literals.
    const value = new Function(`return (${input});`)();
    const expected = new Function(`return (${stored});`)();
    assert.deepStrictEqual(typeset.get(name).normalize(value), expected, `${name}: ${input}`);
  }
});
