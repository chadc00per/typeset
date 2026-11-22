#!/usr/bin/env node
// Pins the answers that would otherwise come from the runtime's ICU, so a
// browser, Node and Python read the same values:
//   data/tlds.json      the IANA top-level domains, from the pinned @hapi/tlds
//   data/timezones.json each accepted zone name (lowercased) → its stored name
//   data/languages.json each 2–3 letter language alias → its replacement
// The answers are this Node's (process.versions.icu); regenerate on purpose,
// since a changed answer changes stored values.
// Usage: node js/scripts/generate-intl-data.js [/path/to/zoneinfo-names.txt]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const OUT = path.join(import.meta.dirname, '../../data');
const write = (name, data) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 0) + '\n');
const source = { icu: process.versions.icu, tz: process.versions.tz, unicode: process.versions.unicode };

// Top-level domains.
const { tlds } = require('@hapi/tlds');
const tldVersion = require('@hapi/tlds/package.json').version;
write('tlds.json', { source: `@hapi/tlds ${tldVersion}`, tlds: [...tlds].sort().join(' ') });

// Time zones: every name ICU resolves, from its canonical list plus the IANA
// names (links included) passed in a file, one per line (Python:
// zoneinfo.available_timezones()).
const ZONE = /^(?:UTC|GMT|[A-Z][A-Z0-9_.+-]*(?:\/[A-Z0-9_.+-]+)+)$/i;
const extra = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean) : [];
const candidates = new Set([...Intl.supportedValuesOf('timeZone'), ...extra, 'UTC', 'GMT', 'Etc/UTC', 'Etc/GMT']);
const zones = {};
for (const name of [...candidates].sort()) {
  if (!ZONE.test(name)) continue;
  try { zones[name.toLowerCase()] = new Intl.DateTimeFormat('en', { timeZone: name }).resolvedOptions().timeZone; } catch { /* not a zone ICU knows */ }
}
write('timezones.json', { source, zones });

// Languages: each two- or three-letter code Intl.Locale rewrites, and to what.
const letters = 'abcdefghijklmnopqrstuvwxyz';
const languages = {};
const codes = [];
for (const a of letters) for (const b of letters) { codes.push(a + b); for (const c of letters) codes.push(a + b + c); }
for (const code of codes) {
  let tag;
  try { tag = new Intl.Locale(code).toString(); } catch { continue; }
  if (tag !== code) languages[code] = tag;
}
write('languages.json', { source, aliases: languages });
console.log(`${tlds.size} TLDs, ${Object.keys(zones).length} zone names, ${Object.keys(languages).length} language aliases`);
