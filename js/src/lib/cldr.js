// The pinned CLDR validity tables (data/geography.json), shared by language,
// country, region and locale.
import geographyData from '../../../data/geography.json' with { type: 'json' };

const sets = new Map();

// Whether `value` is in CLDR table `kind`. CLDR stores consecutive final
// characters as ranges (e.g. US subdivisions); only the requested table is
// expanded, and only on the first value needing it.
export function contains(kind, value) {
  if (!sets.has(kind)) {
    const codes = [];
    for (const token of geographyData[kind].split(' ')) {
      const [start, end] = token.split('~');
      if (!end) codes.push(start);
      else {
        const prefix = start.slice(0, -1);
        for (let c = start.charCodeAt(start.length - 1); c <= end.charCodeAt(0); c++) codes.push(prefix + String.fromCharCode(c));
      }
    }
    sets.set(kind, new Set(codes));
  }
  return sets.get(kind).has(value);
}
