// semver: a Semantic Versioning 2.0.0 version, kept exactly. Components stay
// text, so arbitrarily large integers remain exact; prerelease and build
// identifier case and build metadata are significant data.
import { fail } from '../lib/errors.js';
import { text } from '../lib/text.js';

export const definition = {
  name: 'semver',
  description: 'Semantic Versioning 2.0.0 version, including prerelease/build identifiers',
  example: '2.4.1'
};

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

export function normalize(value, path, type) {
  const raw = text(value, path, type, { max: 512, control: null, empty: true });
  const m = SEMVER.exec(raw);
  if (!m || m[4]?.split('.').some(part => /^0\d+$/.test(part))) return fail(path, type);
  return raw;
}
