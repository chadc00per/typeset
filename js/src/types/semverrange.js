// semverrange: an npm-style version range: comparators (>=1.2.0 <2), tilde and
// caret ranges, hyphen ranges (1.2 - 2) and wildcards, joined by ||. Spacing is
// canonical, a leading v and the = operator are dropped, ~> reads as ~, an
// empty set means any version (*) and so makes the whole range *, and a
// repeated set is kept once.
import { fail } from '../lib/errors.js';
import { CONTROL_EXCEPT_TAB, text } from '../lib/text.js';

export const definition = {
  name: 'semverrange',
  description: 'npm-style semver range: comparators, ~, ^, hyphen ranges, wildcards, ||',
  example: '>=1.2.0 <2',
  className: 'SemverRange'
};

// A partial version in a range: 1, 1.2, 1.x, 1.2.3-beta.1; x, X and * are wildcards.
const PARTIAL = /^v?(0|[1-9]\d*|[xX*])(?:\.(0|[1-9]\d*|[xX*])(?:\.(0|[1-9]\d*|[xX*])(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?)?)?$/;
const COMPARATOR = /^(<=|>=|<|>|=|~>|~|\^)?(.+)$/;

// One version in a range, with wildcards spelled x and nothing after the first one: "1.X.*" → "1.x".
function partial(raw, path, type) {
  const m = PARTIAL.exec(raw);
  if (!m || m[4]?.split('.').some(part => /^0\d+$/.test(part))) return fail(path, type);
  const parts = m.slice(1, 4).filter(p => p !== undefined).map(p => (/^[xX*]$/.test(p) ? 'x' : p));
  const wild = parts.indexOf('x');
  if (wild !== -1 && (m[4] || m[5] || parts.slice(wild).some(p => p !== 'x'))) return fail(path, type);
  if (wild === 0) return '*';
  const version = (wild === -1 ? parts : parts.slice(0, wild + 1)).join('.');
  return version + (m[4] ? `-${m[4]}` : '') + (m[5] ? `+${m[5]}` : '');
}

export function normalize(value, path, type) {
  const raw = text(value, path, type, { max: 1024, control: CONTROL_EXCEPT_TAB, empty: true });
  const sets = raw.split('||').map(set => {
    set = set.trim();
    if (!set) return '*';
    const hyphen = /^(\S+)[ \t]+-[ \t]+(\S+)$/.exec(set);
    if (hyphen) return `${partial(hyphen[1], path, type)} - ${partial(hyphen[2], path, type)}`;
    return set.replace(/(<=|>=|<|>|=|~>|~|\^)[ \t]+/g, '$1').split(/[ \t]+/).map(token => {
      const m = COMPARATOR.exec(token);
      if (!m) return fail(path, type);
      const operator = m[1] === '~>' ? '~' : m[1] === '=' ? '' : m[1] || '';
      return operator + partial(m[2], path, type);
    }).join(' ');
  });
  return sets.includes('*') ? '*' : [...new Set(sets)].join(' || ');
}
