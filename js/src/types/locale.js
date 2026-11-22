// locale: a canonical BCP 47 locale (Unicode BCP 47 locale identifier). The
// tag is canonicalized here, not by the runtime's Intl, so every runtime stores
// the same value: the algorithm is the one ICU runs for Intl.Locale (parse,
// legacy tags, alias replacement, variant and extension ordering, -u- and -t-
// keyword aliases), with the alias tables pinned from one ICU
// (data/locales.json, js/scripts/generate-locale-data.js). The pinned CLDR tables
// then refuse invented languages, scripts, regions and variants; extension
// values are syntax-checked, not registry-checked.
import { contains } from '../lib/cldr.js';
import { fail } from '../lib/errors.js';
import { text } from '../lib/text.js';
import data from '../../../data/locales.json' with { type: 'json' };

export const definition = {
  name: 'locale',
  description: 'Canonical Unicode BCP 47 locale identifier',
  example: 'en-US'
};

export function normalize(value, path, type) {
  const raw = text(value, path, type);
  const locale = canonicalize(raw.replaceAll('_', '-'));
  if (!locale) return fail(path, type);
  const { language, script, region } = locale;
  if (!contains('language', language || 'und') ||
      (script && !contains('script', script)) ||
      (region && !contains('localeRegion', region))) return fail(path, type);
  // The variants as the base name spells them: a lone POSIX variant reads as
  // "-u-va-posix" there, and is refused like any unregistered variant.
  const variants = baseName(locale).split('-').slice(1);
  if (script) variants.shift();
  if (region) variants.shift();
  if (variants.some(v => !contains('variant', v))) return fail(path, type);
  return languageTag(locale);
}

// ---------------------------------------------------------------------------
// Subtag grammar.

const ALPHA = /^[A-Za-z]+$/;
const DIGIT = /^[0-9]+$/;
const ALNUM = /^[A-Za-z0-9]+$/;
const isAlpha = (s, min, max) => s.length >= min && s.length <= max && ALPHA.test(s);
const isDigit = (s, min, max) => s.length >= min && s.length <= max && DIGIT.test(s);
const isAlnum = (s, min, max) => s.length >= min && s.length <= max && ALNUM.test(s);
const isLanguage = s => isAlpha(s, 2, 3) || isAlpha(s, 5, 8);
const isScript = s => isAlpha(s, 4, 4);
const isRegion = s => isAlpha(s, 2, 2) || isDigit(s, 3, 3);
const isVariant = s => isAlnum(s, 5, 8) || (s.length === 4 && isDigit(s[0], 1, 1) && isAlnum(s, 4, 4));
const isSingleton = s => isAlnum(s, 1, 1) && s.toLowerCase() !== 'x';
const isUnicodeKey = s => s.length === 2 && isAlnum(s[0], 1, 1) && isAlpha(s[1], 1, 1);
const isTKey = s => s.length === 2 && isAlpha(s[0], 1, 1) && isDigit(s[1], 1, 1);
const isList = (value, test) => value.split('-').every(test);
const title = s => s[0].toUpperCase() + s.slice(1).toLowerCase();
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const MAX_KEYWORDS = 25;
const MAX_VARIANTS = 179;

// unicode_language_id at the start of the tag; what follows the first
// singleton is left to the parser.
function startsWithLanguageId(tag) {
  const tokens = tag.split('-');
  if (tag.endsWith('-')) tokens.pop();
  if (!isLanguage(tokens[0])) return false;
  if (tokens.length === 1 || isAlnum(tokens[1], 1, 1)) return true;
  let i = 1;
  if (isScript(tokens[i]) && ++i === tokens.length) return true;
  if (isRegion(tokens[i])) i++;
  for (; i < tokens.length; i++) {
    if (isAlnum(tokens[i], 1, 1)) return true;
    if (!isVariant(tokens[i])) return false;
  }
  return true;
}

// -t- content: tlang? (tkey tvalue+)*
function isTransformed(value) {
  let state = 'start';
  for (const s of value.split('-')) {
    if (state === 'start' && isAlpha(s, 2, 8) && s.length !== 4) state = 'language';
    else if (state === 'language' && isScript(s)) state = 'script';
    else if ((state === 'language' || state === 'script') && isRegion(s)) state = 'region';
    else if (['language', 'script', 'region', 'variant'].includes(state) && isVariant(s)) state = 'variant';
    else if (state !== 'key' && isTKey(s)) state = 'key';
    else if ((state === 'key' || state === 'value') && isAlnum(s, 3, 8)) state = 'value';
    else return false;
  }
  return state !== 'key';
}

// ---------------------------------------------------------------------------
// Parsing: a tag becomes {language, extlang, script, region, variants (upper
// case, in order), extensions (singleton → value), privateuse}, or null if the
// whole tag does not parse and `strict`.

const LANG = 1, EXTL = 2, SCRT = 4, REGN = 8, VART = 16, EXTS = 32, EXTV = 64, PRIV = 128;

function parse(input, strict) {
  let tag = input;
  const lower = tag.toLowerCase();
  for (const [prefix, replacement] of Object.entries(data.prefixes)) {
    if (lower.startsWith(prefix) && (lower.length === prefix.length || lower[prefix.length] === '-')) {
      tag = replacement + tag.slice(prefix.length);
      break;
    }
  }
  const t = { language: '', extlang: [], script: '', region: '', variants: [], extensions: new Map(), privateuse: '' };
  const tokens = tag.length < 2 ? [] : tag.split('-');
  let next = LANG | PRIV, i = 0, good = 0, key = null, values = [], end = 0, privateuseVariant = false;
  const closeExtension = () => {
    if (!values.length || t.extensions.has(key)) return false;
    t.extensions.set(key, values.join('-').toLowerCase());
    key = null;
    good = end;
    return true;
  };
  while (i < tokens.length) {
    const s = tokens[i];
    if (next & LANG && isAlpha(s, 2, 8)) {
      t.language = s.toLowerCase();
      good = ++i;
      next = SCRT | REGN | VART | EXTS | PRIV | (s.length <= 3 ? EXTL : 0);
      continue;
    }
    if (next & EXTL && isAlpha(s, 3, 3)) {
      t.extlang.push(s.toLowerCase());
      good = ++i;
      next = (t.extlang.length < 3 ? EXTL : 0) | SCRT | REGN | VART | EXTS | PRIV;
      continue;
    }
    if (next & SCRT && isScript(s)) { t.script = title(s); good = ++i; next = REGN | VART | EXTS | PRIV; continue; }
    if (next & REGN && isRegion(s)) { t.region = s.toUpperCase(); good = ++i; next = VART | EXTS | PRIV; continue; }
    if (next & VART && (isVariant(s) || (privateuseVariant && isAlnum(s, 1, 8)))) {
      const variant = s.toUpperCase();
      if (t.variants.includes(variant)) break;
      t.variants.push(variant);
      good = ++i;
      next = VART | EXTS | PRIV;
      continue;
    }
    if (next & EXTS && isSingleton(s)) {
      if (key !== null && !closeExtension()) { key = null; break; }
      key = s.toLowerCase();
      values = [];
      i++;
      next = EXTV;
      continue;
    }
    if (next & EXTV && isAlnum(s, 2, 8)) { values.push(s); end = ++i; next = EXTS | EXTV | PRIV; continue; }
    if (next & PRIV && s.toLowerCase() === 'x') {
      if (key !== null && !closeExtension()) { key = null; break; }
      if (i + 1 >= tokens.length) break;
      // ICU reads "-x-lvariant-" (as written, lowercase) as the start of
      // more variants, of one to eight characters.
      let j = i + 1, last = 0, lvariant = false;
      for (; j < tokens.length; j++) {
        if (tokens[j].startsWith('lvariant')) { lvariant = true; j++; break; }
        if (!isAlnum(tokens[j], 1, 8)) break;
        last = j + 1;
      }
      if (lvariant) { next = VART; privateuseVariant = true; i = j; continue; }
      if (last) { t.privateuse = tokens.slice(i + 1, last).join('-').toLowerCase(); good = last; }
      break;
    }
    break;
  }
  if (key !== null) closeExtension();
  if (strict && good !== tokens.length) return null;
  return t;
}

// ---------------------------------------------------------------------------
// The locale as ICU holds it: {language ('' for und), script, region,
// variants (upper case), keywords}. Keywords map a -u- key to its value
// ("yes" when typeless), "attribute" to the sorted -u- attributes, and a
// singleton (x included) to its value.

const KEYWORDS = data.keywords;
const unicodeValue = (key, value) => KEYWORDS[key]?.[value] ?? value;

function fromTag(t) {
  const locale = {
    language: (t.extlang[0] ?? t.language) === 'und' ? '' : t.extlang[0] ?? t.language,
    script: t.script,
    region: t.region,
    variants: [...t.variants].sort(compare),
    keywords: new Map()
  };
  let posix = false;
  for (const [key, value] of [...t.extensions].sort(([a], [b]) => compare(a, b))) {
    if (key !== 'u') { locale.keywords.set(key, value); continue; }
    const subtags = value.split('-');
    let k = 0;
    const attributes = [];
    for (; k < subtags.length && !isUnicodeKey(subtags[k]); k++) if (!attributes.includes(subtags[k])) attributes.push(subtags[k]);
    if (attributes.length) locale.keywords.set('attribute', attributes.sort(compare).join('-'));
    while (k < subtags.length) {
      const name = subtags[k++];
      const type = [];
      while (k < subtags.length && !isUnicodeKey(subtags[k])) type.push(subtags[k++]);
      const canonical = type.length ? unicodeValue(name, type.join('-')) : 'yes';
      if (!t.variants.length && name === 'va' && canonical === 'posix') posix = true;
      else if (!locale.keywords.has(name)) locale.keywords.set(name, canonical);
    }
  }
  if (t.privateuse) locale.keywords.set('x', t.privateuse);
  if (posix) locale.variants.push('POSIX');
  return locale;
}

// The ICU locale ID's own limits.
const fits = locale => locale.keywords.size <= MAX_KEYWORDS && locale.variants.join('_').length <= MAX_VARIANTS;

// Locale::forLanguageTag: parse, then read back as a locale ID. An ID without
// keywords whose subtags (the last aside) include a one-character one (from
// "-x-lvariant-") is parsed again as a language tag, with "_" read as "-".
function forLanguageTag(tag) {
  const t = parse(tag, true);
  if (!t) return null;
  let locale = fromTag(t);
  const id = [locale.language, locale.script, locale.region].filter(Boolean).join('_') +
    (locale.variants.length ? (locale.region ? '_' : '__') + locale.variants.join('_') : '');
  if (!locale.keywords.size && id.split('_').slice(0, -1).some(s => s.length === 1)) {
    if (!locale.language) return null;
    locale = fromTag(parse(id.replaceAll('_', '-'), false));
  }
  return fits(locale) ? locale : null;
}

// LocaleBuilder::build: the fields and keywords must be well-formed. The ID is
// rebuilt from "language-script-region-variants", where ICU reads a first
// variant of four letters and more straight after the language as a script
// (dropping the variants).
function build(locale) {
  if (locale.language && !isAlpha(locale.language, 2, 8)) return null;
  if (!locale.variants.every(isVariant)) return null;
  for (const [key, value] of locale.keywords) {
    const ok = key === 'attribute' ? isList(value, s => isAlnum(s, 3, 8))
      : key === 't' ? isTransformed(value)
        : key === 'x' ? isList(value, s => isAlnum(s, 1, 8))
          : key.length === 1 ? isList(value, s => isAlnum(s, 2, 8))
            : isList(value, s => isAlnum(s, 3, 8));
    if (!ok) return null;
  }
  const built = { ...locale, variants: [...locale.variants], keywords: new Map(locale.keywords) };
  const first = built.variants[0];
  if (!built.script && !built.region && first && /^[A-Za-z]{4}[^A-Za-z]/.test(first)) {
    built.script = title(first.slice(0, 4));
    built.variants = [];
  }
  return built;
}

// ---------------------------------------------------------------------------
// Alias replacement (ICU's AliasReplacer), then the -t- and -u-rg/-u-sd
// keyword values. Returns the canonical locale, or null.

const RULES = { ...data.languages, ...data.rules };
const REGION_CHOICES = Object.fromEntries(Object.entries(data.regionChoices).map(([region, by]) =>
  [region, Object.fromEntries(Object.entries(by).flatMap(([choice, keys]) => keys.split(' ').map(key => [key, choice])))]));
const VARIANT_DROPS = Object.fromEntries(Object.entries(data.variantDrops).map(([v, drops]) => [v, drops.split(' ')]));

// A replacement as ICU splits it: language, then script, region, variant.
function splitReplacement(replacement) {
  const fields = replacement.split('-');
  const r = { language: fields[0], script: null, region: null, variant: null, extensions: null };
  let i = 1;
  if (fields[i]?.length === 4 && isAlpha(fields[i][0], 1, 1)) r.script = fields[i++];
  if (fields[i] && fields[i].length >= 2 && fields[i].length <= 3) r.region = fields[i++];
  if (fields[i] && fields[i].length >= 4) r.variant = fields[i++];
  if (i < fields.length) r.extensions = fields.slice(i).join('-');
  return r;
}

const deleteOrReplace = (input, type, replacement) => (replacement ? input ?? replacement : type === null ? input : null);

function replaceLanguage(s, checkLanguage, checkRegion, checkVariants) {
  if ((checkRegion && !s.region) || (checkVariants && !s.variants.length)) return false;
  const count = checkVariants ? s.variants.length : 1;
  const searchLanguage = checkLanguage ? s.language ?? '' : 'und';
  const searchRegion = checkRegion ? s.region : null;
  for (let i = 0; i < count; i++) {
    let searchVariant = checkVariants ? s.variants[i] : null;
    if (searchVariant !== null && searchVariant.length < 4) searchVariant = null;
    const key = [searchLanguage, searchRegion, searchVariant].filter(f => f !== null).join('-');
    if (!Object.hasOwn(RULES, key)) continue;
    const r = splitReplacement(RULES[key]);
    const language = r.language === 'und' ? s.language : r.language;
    const script = deleteOrReplace(s.script, null, r.script);
    const region = deleteOrReplace(s.region, searchRegion, r.region);
    const variant = deleteOrReplace(searchVariant, searchVariant, r.variant);
    if (language === s.language && script === s.script && region === s.region && variant === searchVariant && r.extensions === null) continue;
    Object.assign(s, { language, script, region });
    if (searchVariant !== null) {
      if (variant) s.variants[i] = variant;
      else s.variants.splice(i, 1);
    }
    return true;
  }
  return false;
}

// A region with several replacements becomes the language's likely region
// among them, else the first.
function replaceTerritory(s) {
  if (!s.region || !Object.hasOwn(data.regions, s.region)) return false;
  const by = REGION_CHOICES[s.region] ?? {};
  const language = s.language ?? 'und';
  const choice = (s.script && by[`${language}-${s.script}`]) || by[language];
  s.region = choice ?? data.regions[s.region];
  return true;
}

function replaceScript(s) {
  if (!s.script || !Object.hasOwn(data.scripts, s.script)) return false;
  s.script = data.scripts[s.script];
  return true;
}

function replaceVariant(s) {
  for (let i = 0; i < s.variants.length; i++) {
    const variant = s.variants[i];
    if (!Object.hasOwn(data.variants, variant) || data.variants[variant] === variant) continue;
    s.variants[i] = data.variants[variant];
    for (const drop of VARIANT_DROPS[variant] ?? []) {
      for (let j = 0; j < s.variants.length; j++) if (s.variants[j] === drop) s.variants.splice(j, 1);
    }
    return true;
  }
  return false;
}

function canonicalizeLocale(locale) {
  const s = {
    language: locale.language || null,
    script: locale.script || null,
    region: locale.region || null,
    variants: []
  };
  for (const v of locale.variants) if (!s.variants.includes(v.toLowerCase())) s.variants.push(v.toLowerCase());
  s.variants.sort(compare);
  let changed = 0;
  for (;;) {
    if (replaceLanguage(s, true, true, true) || replaceLanguage(s, true, true, false) ||
        replaceLanguage(s, true, false, true) || replaceLanguage(s, true, false, false) ||
        replaceLanguage(s, false, false, true) || replaceTerritory(s) || replaceScript(s) || replaceVariant(s)) {
      if (++changed > 50) return null;
      continue;
    }
    break;
  }
  if (changed === 0 && s.variants.length <= 1 && !locale.keywords.size) return locale;
  const keywords = new Map(locale.keywords);
  for (const [key, value] of locale.keywords) {
    if ((key === 'sd' || key === 'rg') && Object.hasOwn(data.subdivisions, value)) {
      if (data.subdivisions[value]) keywords.set(key, data.subdivisions[value]);
      else keywords.delete(key);
    } else if (key === 't') {
      const transformed = canonicalTransformed(value);
      if (transformed === null) return null;
      keywords.set(key, transformed);
    }
  }
  const result = {
    language: s.language ?? '',
    script: s.script ?? '',
    region: s.region ?? '',
    variants: [...s.variants].sort(compare).map(v => v.toUpperCase()),
    keywords
  };
  return fits(result) ? result : null;
}

// -t-: the tlang canonicalized as a locale and lowercased, then the fields
// sorted (as written) with their values canonicalized.
function canonicalTransformed(value) {
  const subtags = value.split('-');
  let k = subtags.findIndex(isTKey);
  if (k < 0) k = subtags.length;
  const output = [];
  if (k > 0) {
    let tlang = forLanguageTag(subtags.slice(0, k).join('-'));
    if (tlang) tlang = build(tlang);
    if (tlang) tlang = canonicalizeLocale(tlang);
    if (!tlang) return null;
    output.push(languageTag(tlang).toLowerCase());
  }
  const fields = [];
  while (k < subtags.length) {
    let end = k + 1;
    while (end < subtags.length && !isTKey(subtags[end])) end++;
    if (end === k + 1) return null;
    fields.push(subtags.slice(k, end).join('-'));
    k = end;
  }
  for (const field of fields.sort(compare)) {
    const key = field.slice(0, 2);
    const v = field.slice(3);
    output.push(`${key}-${data.tfields[key]?.[v] ?? v}`);
  }
  return output.join('-');
}

// Intl.Locale: parse and build, canonicalize, build again, canonicalize again.
function canonicalize(tag) {
  if (!startsWithLanguageId(tag)) return null;
  let locale = forLanguageTag(tag);
  for (let pass = 0; pass < 2 && locale; pass++) {
    locale = build(locale);
    if (locale) locale = canonicalizeLocale(locale);
  }
  return locale;
}

// ---------------------------------------------------------------------------
// Writing the tag back out.

function baseSubtags(locale) {
  const subtags = [locale.language || 'und'];
  if (locale.script) subtags.push(locale.script);
  if (locale.region) subtags.push(locale.region);
  const posix = locale.variants.join('_') === 'POSIX';
  if (!posix) {
    const variants = [];
    for (const v of locale.variants) if (!variants.includes(v.toLowerCase())) variants.push(v.toLowerCase());
    subtags.push(...variants.sort(compare));
  }
  return { subtags, posix };
}

function baseName(locale) {
  const { subtags, posix } = baseSubtags(locale);
  return subtags.join('-') + (posix ? '-u-va-posix' : '');
}

// Singletons in order with the -u- keys (attributes first, then by key) where
// "u" sorts and private use last; a value of exactly "true" or "yes" is dropped.
function languageTag(locale) {
  const { subtags, posix } = baseSubtags(locale);
  // A bare private-use tag ("und-x-…") is written as is.
  if (!locale.language && !locale.script && !locale.region && !locale.variants.length &&
      locale.keywords.size === 1 && locale.keywords.has('x')) return `und-x-${locale.keywords.get('x')}`;
  const keywords = new Map(locale.keywords);
  if (posix && !keywords.has('va')) keywords.set('va', 'posix');
  const rank = key => (key === 'x' ? '~' : key.length === 1 ? key : key === 'attribute' ? 'u ' : `u-${key}`);
  const entries = [...keywords].sort(([a], [b]) => compare(rank(a), rank(b)));
  const out = [...subtags];
  let unicode = false;
  for (const [key, value] of entries) {
    if (key.length > 1 && !unicode) { out.push('u'); unicode = true; }
    if (key === 'attribute') { out.push(value); continue; }
    out.push(key);
    if (value !== 'true' && value !== 'yes') out.push(value);
  }
  return out.join('-');
}
