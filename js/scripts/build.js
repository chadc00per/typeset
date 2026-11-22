// Builds dist/ from src/. src/ stays the ES module source that Node, bundlers
// and `import` read directly; dist/ adds the formats src/ can't be loaded as:
//
//   index.cjs                CommonJS, for tools that require() without Node's
//                            native require(esm) (Jest, webpack's require path)
//   index.d.cts              the typings, as a CommonJS declaration file
//   typeset.browser.js       one self-contained ES module for <script type="module">
//                            without a bundler or import map
//   typeset.global.js        one self-contained classic script: window.Typeset
//   typeset.browser-lite.js  the same two without the bundled third-party code
//   typeset.global-lite.js   (src/lib/vendor.lite.js): a fraction of the size, for
//                            pages that never check a phone number or a function
//
// Run: node js/scripts/build.js (npm run build; also runs before npm test and npm pack)
import { build } from 'esbuild';
import { bundledPackages, licenseNotice } from './licenses.js';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const dist = path.join(root, 'js/dist');
const entry = path.join(root, 'js/src/index.js');
const banner = `/*! ${pkg.name} ${pkg.version} | ${pkg.license} | see LICENSE, NOTICE and THIRD-PARTY-NOTICES.md */`;
// The browser builds also carry the runtime dependencies' code, so they name
// the file holding those dependencies' license texts.
const browserBanner = banner.replace(' */', ', and js/dist/THIRD-PARTY-LICENSES.txt for bundled dependencies */');

fs.rmSync(dist, { recursive: true, force: true });

// #vendor → a module of the build's choosing, in place of package.json "imports".
const vendorFrom = file => ({
  name: 'vendor',
  setup(b) { b.onResolve({ filter: /^#vendor$/ }, () => ({ path: path.join(root, file) })); }
});

// The CommonJS build: #vendor → src/lib/vendor.require.js's plain require()
// instead of vendor.node.js's createRequire().
await build({
  entryPoints: [entry],
  outfile: path.join(dist, 'index.cjs'),
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node22',
  packages: 'external',
  plugins: [vendorFrom('js/src/lib/vendor.require.js')],
  charset: 'utf8',
  banner: { js: banner },
  logLevel: 'warning'
});

// Self-contained browser builds: dependencies bundled, #vendor → src/lib/vendor.js.
const browser = {
  entryPoints: [entry],
  bundle: true,
  platform: 'browser',
  target: ['es2022', 'chrome111', 'firefox113', 'safari16.4'],
  conditions: ['browser'],
  minify: true,
  // No source maps: they'd double the package for code that is readable in src/.
  sourcemap: false,
  legalComments: 'eof',
  charset: 'utf8',
  banner: { js: browserBanner },
  logLevel: 'warning'
};
const full = await build({ ...browser, format: 'esm', metafile: true, outfile: path.join(dist, 'typeset.browser.js') });
await build({ ...browser, format: 'iife', globalName: 'Typeset', outfile: path.join(dist, 'typeset.global.js') });
// The lite builds bundle no third-party code, so they carry the package's own banner.
const lite = { ...browser, banner: { js: banner }, plugins: [vendorFrom('js/src/lib/vendor.lite.js')] };
await build({ ...lite, format: 'esm', outfile: path.join(dist, 'typeset.browser-lite.js') });
await build({ ...lite, format: 'iife', globalName: 'Typeset', outfile: path.join(dist, 'typeset.global-lite.js') });

fs.copyFileSync(path.join(root, 'js/src/index.d.ts'), path.join(dist, 'index.d.cts'));

// The license text of every package bundled into the browser builds, dependencies of dependencies included.
const notices = bundledPackages(full.metafile).map(licenseNotice);
fs.writeFileSync(path.join(dist, 'THIRD-PARTY-LICENSES.txt'),
  `Third-party code bundled into js/dist/typeset.browser.js and js/dist/typeset.global.js.\n` +
  `google-libphonenumber includes Google's libphonenumber and the Google Closure Library (Apache-2.0).\n` +
  `${pkg.name}'s own code and data notices: LICENSE, NOTICE, THIRD-PARTY-NOTICES.md.\n\n` + notices.join('\n'));

for (const file of fs.readdirSync(dist).filter(f => !f.endsWith('.map'))) {
  console.log(`js/dist/${file}  ${(fs.statSync(path.join(dist, file)).size / 1024).toFixed(1)} kB`);
}
