// semver: Semantic Versioning 2.0.0 version, including prerelease/build identifiers.
import { test } from 'node:test';
import { Semver } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('semver: SemVer 2.0.0, kept exactly', () => {
  accepts(Semver, [[' 2.4.1 ', '2.4.1'], ['1.0.0-alpha.1+Build.5', '1.0.0-alpha.1+Build.5']]);
  refuses(Semver, ['v1.0.0', '1.0', '01.0.0', '1.0.0-alpha.01']);
});
