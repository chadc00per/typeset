// python/chadc00per_typeset/_parsers.js is src/lib/code.js and its parsers,
// bundled for the Python package to run (scripts/generate-python-parsers.js).
// A change to code.js or a parser's version fails here until `npm run parsers`
// regenerates it, so the two packages can't drift apart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

test('the Python package\'s parser bundle is current', () => {
  const script = path.join(import.meta.dirname, '../scripts/generate-python-parsers.js');
  assert.doesNotThrow(() => execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' }), 'run npm run parsers');
});
