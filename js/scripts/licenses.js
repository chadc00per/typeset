// The license texts of the third-party packages a bundle includes, for
// js/scripts/build.js (js/dist/THIRD-PARTY-LICENSES.txt) and
// js/scripts/generate-python-parsers.js (_parsers.LICENSES.txt). A package that
// publishes no license file (saxes 6.0.0) has its repository's copy in
// js/scripts/licenses/<name>.LICENSE.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '../..');

// The packages an esbuild metafile's inputs came from, sorted.
export function bundledPackages(metafile) {
  return [...new Set(Object.keys(metafile.inputs)
    .map(input => /node_modules\/((?:@[^/]+\/)?[^/]+)\//.exec(input)?.[1]).filter(Boolean))].sort();
}

// One package's license, headed by its name, version and license id.
export function licenseNotice(name) {
  const dir = path.join(ROOT, 'node_modules', name);
  const { version, license } = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const own = fs.readdirSync(dir).find(f => /^licen[cs]e(\.(md|txt))?$/i.test(f));
  const kept = path.join(ROOT, 'js/scripts/licenses', `${name.replace('/', '__')}.LICENSE`);
  const file = own ? path.join(dir, own) : fs.existsSync(kept) ? kept : null;
  if (!file) throw new Error(`${name}: no license file; add its repository's to scripts/licenses/`);
  return `${'='.repeat(78)}\n${name}@${version} (${license})\n${'='.repeat(78)}\n\n${fs.readFileSync(file, 'utf8').trim()}\n`;
}
