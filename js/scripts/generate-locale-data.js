#!/usr/bin/env node
// Pins the alias data a BCP 47 locale is canonicalized with, so a browser,
// Node and Python store the same value for the same tag (data/locales.json).
// Every answer is this Node's Intl.Locale (process.versions.icu); CLDR's
// alias and BCP 47 files (the release that ICU ships) only say which tags to
// ask about, since subtags of five to eight letters cannot be enumerated.
// Regenerate on purpose: a changed answer changes stored values.
//
//   prefixes     whole-tag legacy prefixes ICU rewrites before parsing
//   languages    language subtag → replacement ("sh" → "sr-Latn")
//   rules        language + region and/or variant → replacement ("sgn-GR" → "gss")
//   scripts      script → replacement
//   regions      region → replacement; regionChoices: where the replacement
//                depends on the language's likely region ("SU" → "AM" for hy)
//   variants     variant → replacement; variantDrops: variants removed with it
//   keywords     -u- key → value → canonical value; tfields: the same for -t-
//   subdivisions -u-rg/-u-sd subdivision → replacement ("" removes the key)
//
// Usage: node js/scripts/generate-locale-data.js /path/to/cldr/common
// (a checkout of https://github.com/unicode-org/cldr/tree/release-48/common:
// supplemental/supplementalMetadata.xml, supplemental/likelySubtags.xml,
// validity/variant.xml and bcp47/*.xml are read).
import fs from 'node:fs';
import path from 'node:path';
import geography from '../../data/geography.json' with { type: 'json' };

const CLDR = process.argv[2];
if (!CLDR) throw new Error('usage: node js/scripts/generate-locale-data.js /path/to/cldr/common');
const read = name => fs.readFileSync(path.join(CLDR, name), 'utf8');
const OUT = path.join(import.meta.dirname, '../../data/locales.json');

const locale = tag => { try { return new Intl.Locale(tag); } catch { return null; } };
const canon = tag => locale(tag)?.toString() ?? null;
const letters = 'abcdefghijklmnopqrstuvwxyz';
const expand = kind => {
  const codes = [];
  for (const token of geography[kind].split(' ')) {
    const [start, end] = token.split('~');
    if (!end) codes.push(start);
    else for (let c = start.charCodeAt(start.length - 1); c <= end.charCodeAt(0); c++) codes.push(start.slice(0, -1) + String.fromCharCode(c));
  }
  return codes;
};
const VARIANT = /^(?:[a-z0-9]{5,8}|[0-9][a-z0-9]{3})$/;
const TYPE = /^[a-z0-9]{3,8}(?:-[a-z0-9]{3,8})*$/;
const sorted = object => Object.fromEntries(Object.entries(object).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

const metadata = read('supplemental/supplementalMetadata.xml');
const aliases = kind => [...metadata.matchAll(new RegExp(`<${kind}Alias type="([^"]+)" replacement="([^"]*)"`, 'g'))].map(m => m[1]);

// Language subtags alone: every two- and three-letter code, plus any longer
// one CLDR aliases.
const languages = {};
const codes = [];
for (const a of letters) for (const b of letters) { codes.push(a + b); for (const c of letters) codes.push(a + b + c); }
for (const type of aliases('language')) if (/^[a-z]{5,8}$/.test(type)) codes.push(type);
for (const code of codes) {
  const tag = canon(code);
  if (tag && tag !== code) languages[code] = tag;
}

// Language rules with a region and/or one variant. A script is put in the
// probe so ICU's whole-tag legacy prefixes (below) do not answer instead.
const rules = {};
for (const type of aliases('language')) {
  const [language, ...rest] = type.split('_');
  if (!rest.length || language === 'i') continue;
  const region = rest.find(s => /^(?:[A-Z]{2}|[0-9]{3})$/.test(s));
  const variants = rest.filter(s => s !== region);
  if (variants.length > 1 || variants.some(v => !VARIANT.test(v)) || (language === 'und' && region)) continue;
  const answer = canon([language, 'Zzzz', region, ...variants].filter(Boolean).join('-'));
  if (!answer) continue;
  const key = [language, region, ...variants].filter(Boolean).join('-');
  const replacement = answer.split('-').filter(s => s !== 'Zzzz').join('-');
  if (replacement !== key) rules[key] = replacement;
}

// ICU's own whole-tag legacy table (uloc_tag.cpp LEGACY and REDUNDANT): the
// names are ICU's, the answers Intl's. Only those Intl.Locale accepts matter.
const LEGACY = ['art-lojban', 'cel-gaulish', 'en-gb-oed', 'no-bok', 'no-nyn', 'sgn-be-fr', 'sgn-be-nl', 'sgn-ch-de',
  'zh-guoyu', 'zh-hakka', 'zh-min-nan', 'zh-xiang', 'zh-min', 'zh-cmn', 'zh-cmn-hans', 'zh-cmn-hant', 'zh-gan', 'zh-wuu',
  'zh-yue', 'ja-latn-hepburn-heploc',
  ...['br', 'co', 'de', 'dk', 'es', 'fr', 'gb', 'gr', 'ie', 'it', 'jp', 'mx', 'ni', 'nl', 'no', 'pt', 'se', 'us', 'za'].map(r => `sgn-${r}`)];
const prefixes = {};
for (const name of LEGACY) {
  const answer = canon(name);
  if (answer && answer.toLowerCase() !== name) prefixes[name] = answer;
}

// Scripts: every four-letter subtag.
const scripts = {};
for (const a of letters) for (const b of letters) for (const c of letters) for (const d of letters) {
  const script = a.toUpperCase() + b + c + d;
  const replaced = locale(`und-${script}`)?.script;
  if (replaced && replaced !== script) scripts[script] = replaced;
}

// Regions: every two-letter and three-digit subtag. When the replacement
// differs by language, ICU picks the language's (and script's) likely region
// if it is one of the candidates, else the first.
const canonical = codes.filter(code => code.length <= 3 && !languages[code] && canon(code) === code);
const likely = [...read('supplemental/likelySubtags.xml').matchAll(/<likelySubtag from="([a-z]{2,3})_([A-Z][a-z]{3})"/g)].map(m => [m[1], m[2]]);
const allScripts = expand('script');
const regionCodes = [];
for (const a of letters) for (const b of letters) regionCodes.push((a + b).toUpperCase());
for (let n = 0; n < 1000; n++) regionCodes.push(String(n).padStart(3, '0'));
const regions = {};
const regionChoices = {};
const unknown = canonical.find(code => !locale(code).maximize().region);
for (const region of regionCodes) {
  const alone = locale(`und-${region}`)?.region;
  if (!alone || alone === region) continue;
  const choose = tag => locale(`${tag}-${region}`).region;
  const fallback = choose(unknown);
  const by = {};
  // (undefined: a language rule took the region, as for "sgn-CO" → "csn")
  const note = (key, choice, otherwise) => { if (choice && choice !== otherwise) (by[choice] ??= []).push(key); };
  for (const code of canonical) note(code, choose(code), fallback);
  for (const script of allScripts) note(`und-${script}`, choose(`und-${script}`), choose('und'));
  for (const [code, script] of likely) if (!languages[code] && code !== 'und') note(`${code}-${script}`, choose(`${code}-${script}`), choose(code));
  regions[region] = fallback;
  if (Object.keys(by).length) regionChoices[region] = sorted(Object.fromEntries(Object.entries(by).map(([choice, keys]) => [choice, keys.sort().join(' ')])));
}
// Check the language+script fallback rule on a deterministic sample.
{
  const index = Object.fromEntries(Object.entries(regionChoices).map(([region, by]) => [region, Object.fromEntries(Object.entries(by).flatMap(([choice, keys]) => keys.split(' ').map(key => [key, choice])))]));
  const predict = (region, code, script) => {
    const by = index[region] ?? {};
    return by[`${code}-${script}`] ?? (code === 'und' ? undefined : by[code]) ?? (code === 'und' ? by.und : undefined) ?? regions[region];
  };
  let checked = 0;
  for (let i = 0; i < canonical.length; i += 7) {
    const script = allScripts[(i * 31) % allScripts.length];
    for (const region of Object.keys(regionChoices)) {
      const actual = locale(`${canonical[i]}-${script}-${region}`).region;
      if (actual !== predict(region, canonical[i], script)) throw new Error(`territory rule: ${canonical[i]}-${script}-${region} → ${actual}`);
      checked++;
    }
  }
  console.log(`checked ${checked} language-script-region choices`);
}

// Variants: CLDR's registered and deprecated ones and those its aliases name.
const variantCandidates = new Set(expand('variant'));
for (const m of read('validity/variant.xml').matchAll(/<id type="variant" idStatus="[^"]+">([^<]+)<\/id>/g)) for (const v of m[1].trim().split(/\s+/)) variantCandidates.add(v.toLowerCase());
for (const type of [...aliases('variant'), ...aliases('language')]) for (const s of type.split('_')) if (VARIANT.test(s.toLowerCase())) variantCandidates.add(s.toLowerCase());
variantCandidates.delete('posix'); // ICU spells a lone POSIX variant as -u-va-posix (code, not data)
const variants = {};
const variantDrops = {};
// Probed after a script: ICU reads a first variant of four letters and a digit
// straight after the language as a script ("und-baku1926" → "und-Baku").
const variantsOf = tag => tag.split('-').filter(s => VARIANT.test(s));
const probe = variant => canon(`und-Zzzz-${variant}`)?.replace('-Zzzz', '');
for (const variant of [...variantCandidates].sort()) {
  const answer = probe(variant);
  if (!answer || answer === `und-${variant}` || rules[`und-${variant}`]) continue;
  const after = variantsOf(answer);
  if (answer === `und-${after[0]}` && after.length === 1) variants[variant] = after[0];
  else rules[`und-${variant}`] = answer;
}
for (const [variant, replacement] of Object.entries(variants)) {
  for (const other of variantCandidates) {
    if (other === variant || probe(other) !== `und-${other}`) continue;
    const answer = variantsOf(probe(`${other}-${variant}`) ?? '');
    if (answer.includes(replacement) && !answer.includes(other)) (variantDrops[variant] ??= []).push(other);
  }
}

// -u- and -t- keyword values, from the BCP 47 data's types and their aliases.
const keywords = {};
const tfields = {};
for (const file of fs.readdirSync(path.join(CLDR, 'bcp47')).filter(f => f.endsWith('.xml')).sort()) {
  for (const block of read(`bcp47/${file}`).matchAll(/<key\b([^>]*)>([\s\S]*?)<\/key>/g)) {
    const key = /\bname="([^"]+)"/.exec(block[1])[1];
    const t = /\bextension="t"/.test(block[1]);
    if (key === 'rg' || key === 'sd') continue;
    const values = new Set(['yes', 'no', 'true', 'false']);
    for (const type of block[2].matchAll(/<type\b([^>]*)>/g)) {
      for (const attr of ['name', 'alias', 'preferred']) {
        const m = new RegExp(`\\b${attr}="([^"]+)"`).exec(type[1]);
        if (m) for (const v of m[1].split(' ')) values.add(v.toLowerCase());
      }
    }
    const table = {};
    for (const value of [...values].sort()) {
      if (!TYPE.test(value)) continue;
      const prefix = `und-${t ? 't' : 'u'}-${key}`;
      const answer = canon(`${prefix}-${value}`);
      if (!answer) continue;
      const result = answer === prefix ? 'true' : answer.startsWith(`${prefix}-`) ? answer.slice(prefix.length + 1) : null;
      if (result === null) throw new Error(`unexpected keyword answer ${prefix}-${value} → ${answer}`);
      const same = result === value || (result === 'true' && (value === 'yes' || value === 'true'));
      if (!same) table[value] = result;
    }
    if (Object.keys(table).length) (t ? tfields : keywords)[key] = table;
  }
}

// Subdivision aliases, which ICU applies to -u-rg and -u-sd values alike.
const subdivisions = {};
for (const type of aliases('subdivision')) {
  const value = type.toLowerCase();
  if (!TYPE.test(value)) continue;
  const answer = canon(`und-u-sd-${value}`);
  const result = answer === 'und' ? '' : answer?.startsWith('und-u-sd-') ? answer.slice(9) : null;
  if (result === null) throw new Error(`unexpected subdivision answer ${value} → ${answer}`);
  if (canon(`und-u-rg-${value}`) !== (result ? `und-u-rg-${result}` : 'und')) throw new Error(`rg and sd disagree on ${value}`);
  if (result !== value) subdivisions[value] = result;
}

const data = {
  source: { icu: process.versions.icu, unicode: process.versions.unicode, candidates: 'CLDR 48 common/' },
  prefixes,
  languages,
  rules: sorted(rules),
  scripts,
  regions,
  regionChoices,
  variants,
  variantDrops: Object.fromEntries(Object.entries(variantDrops).map(([v, drops]) => [v, drops.sort().join(' ')])),
  keywords: sorted(keywords),
  tfields: sorted(tfields),
  subdivisions: sorted(subdivisions)
};
fs.writeFileSync(OUT, JSON.stringify(data) + '\n');
console.log(`${Object.keys(languages).length} languages, ${Object.keys(rules).length} rules, ${Object.keys(regions).length} regions ` +
  `(${Object.keys(regionChoices).length} by language), ${Object.keys(variants).length} variants, ` +
  `${Object.values(keywords).reduce((n, t) => n + Object.keys(t).length, 0)} keyword values, ` +
  `${Object.keys(subdivisions).length} subdivisions; ${fs.statSync(OUT).size} bytes`);
