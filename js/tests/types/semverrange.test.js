// semverrange: npm-style semver range: comparators, ~, ^, hyphen ranges, wildcards, ||.
import { test } from 'node:test';
import { SemverRange } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('semverrange: npm grammar, canonical spacing', () => {
  accepts(SemverRange, [
    ['>= 1.2.3 < 2.0.0', '>=1.2.3 <2.0.0'], ['^1.2 || ~> 2.X.*', '^1.2 || ~2.x'], ['1.2.3 - 2.3', '1.2.3 - 2.3'],
    ['=v1.2.3', '1.2.3'], ['', '*'], ['x', '*'], ['||', '*'], ['^1 || ', '*'], ['^1 || ^1 || 2', '^1 || 2'], ['1.x.x', '1.x'], ['>=1.0.0-beta.1', '>=1.0.0-beta.1']
  ]);
  refuses(SemverRange, ['1.x.3', '>=', '01.2', '1.2.3-01', '1.x-beta', 'latest', '1 - ']);
});
