// email: an email address, lowercased, trimmed and NFC, its domain stored as
// the WHATWG host parser reads it, in Unicode. A stored value is
// the output of this, so its behavior is part of the data format: change it and
// existing values stop comparing equal to new writes.
// The address rule is the one Joi's string().email() applies: RFC 5321
// dot-atoms (RFC 6531 UTF-8 allowed), an IANA top-level domain, no quoted parts
// or address literals. The TLD list is @hapi/tlds', pinned in data/tlds.json.
// Ported from @hapi/address 5 (BSD-3-Clause, © 2019-2022
// Sideway, Inc. and Project contributors) at its default options, minus its
// node:url / node:util imports so a browser runs it. Full notice: THIRD-PARTY-NOTICES.md.
import { fail } from '../lib/errors.js';
import { LONE_SURROGATE } from '../lib/text.js';
import data from '../../../data/tlds.json' with { type: 'json' };

export const definition = {
  name: 'email',
  description: 'Email address, normalized',
  example: 'ada@example.com',
  constraints: 'none',
  control: 'email'
};

const ATEXT = /^[\w!#$%&'*+\-/=?^`{|}~]+$/;
const UTF8_ATOM = /(?:[\xc2-\xdf][\x80-\xbf])|(?:\xe0[\xa0-\xbf][\x80-\xbf])|(?:[\xe1-\xec][\x80-\xbf]{2})|(?:\xed[\x80-\x9f][\x80-\xbf])|(?:[\xee-\xef][\x80-\xbf]{2})|(?:\xf0[\x90-\xbf][\x80-\xbf]{2})|(?:[\xf1-\xf3][\x80-\xbf]{3})|(?:\xf4[\x80-\x8f][\x80-\xbf]{2})/;
// What a local part may not hold though UTF8_ATOM's byte ranges allow it: C1
// controls, spaces, format characters (zero-width, bidi overrides, the BOM)
// and private use. Unicode 17's Cc, Cf, Co and Z, written out rather than as
// \p{} classes so every runtime's Unicode version agrees.
const INVISIBLE = /[\x80-\xa0\xad\u0600-\u0605\u061c\u06dd\u070f\u0890-\u0891\u08e2\u1680\u180e\u2000-\u200f\u2028-\u202f\u205f-\u2064\u2066-\u206f\u3000\ue000-\uf8ff\ufeff\ufff9-\ufffb\u{110bd}\u{110cd}\u{13430}-\u{1343f}\u{1bca0}-\u{1bca3}\u{1d173}-\u{1d17a}\u{e0001}\u{e0020}-\u{e007f}\u{f0000}-\u{ffffd}\u{100000}-\u{10fffd}]/u;
const DOMAIN_CONTROL = /[\x00-\x20@:/\\#!$&'()*+,;=?]/;
const LABEL = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const TLD = /^[a-zA-Z](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
// The longest raw input read: an address is at most 128 characters once trimmed.
const MAX_INPUT = 1024;
const utf8 = new TextEncoder();
// The IANA top-level domains (data/tlds.json), read into a set on the first address.
let tlds;
const topLevelDomains = () => (tlds ||= new Set(data.tlds.split(' ')));

// RFC 3492 Punycode decoding (the part after "xn--"); null when malformed.
// Browsers have no domainToUnicode, so it is written out here.
function punycode(input) {
  const BASE = 36, T_MIN = 1, T_MAX = 26;
  const adapt = (delta, points, first) => {
    delta = first ? Math.floor(delta / 700) : delta >> 1;
    delta += Math.floor(delta / points);
    let k = 0;
    for (; delta > ((BASE - T_MIN) * T_MAX) >> 1; k += BASE) delta = Math.floor(delta / (BASE - T_MIN));
    return k + Math.floor(((BASE - T_MIN + 1) * delta) / (delta + 38));
  };
  const basic = input.lastIndexOf('-');
  const out = [...input.slice(0, Math.max(basic, 0))].map(c => c.codePointAt(0));
  if (out.some(c => c >= 0x80)) return null;
  let n = 128, i = 0, bias = 72;
  for (let at = basic > 0 ? basic + 1 : 0; at < input.length;) {
    const old = i;
    for (let w = 1, k = BASE; ; k += BASE) {
      if (at >= input.length) return null;
      const c = input.charCodeAt(at++);
      const digit = c >= 48 && c <= 57 ? c - 22 : c >= 65 && c <= 90 ? c - 65 : c >= 97 && c <= 122 ? c - 97 : BASE;
      if (digit >= BASE) return null;
      i += digit * w;
      const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
      if (digit < t) break;
      w *= BASE - t;
      if (i > 0x10ffff * (out.length + 1)) return null;
    }
    bias = adapt(i - old, out.length + 1, old === 0);
    n += Math.floor(i / (out.length + 1));
    i %= out.length + 1;
    if (n > 0x10ffff) return null;
    out.splice(i++, 0, n);
  }
  return String.fromCodePoint(...out);
}

// The address as stored, or null: the local part as written, the domain as
// the WHATWG host parser maps it (see canonicalDomain).
function canonicalAddress(address) {
  const ascii = !/[^\x00-\x7f]/.test(address);
  if (!ascii) address = address.normalize('NFC');
  if (LONE_SURROGATE.test(address)) return null;
  const parts = address.split('@');
  if (parts.length !== 2 || !parts[0] || address.length > 254 || utf8.encode(parts[0]).length > 64) return null;
  if (!ascii && INVISIBLE.test(parts[0])) return null;
  const local = parts[0].split('.').every(segment => segment && (ascii ? ATEXT.test(segment)
    : [...segment].every(char => ATEXT.test(char) || UTF8_ATOM.test(String.fromCharCode(...utf8.encode(char))))));
  const domain = local ? canonicalDomain(parts[1]) : null;
  return domain === null ? null : `${parts[0]}@${domain}`;
}
// The domain in Unicode, as the WHATWG host parser reads it, or null. The
// parser maps fullwidth letters, '。', 'ſ' and ignorable characters such as
// the soft hyphen, and a label typed in Punycode is decoded, so each domain
// has one spelling.
function canonicalDomain(domain) {
  if (!domain || domain.length > 256) return null;
  if (/[^\x00-\x7f]/.test(domain)) domain = domain.normalize('NFC');
  if (DOMAIN_CONTROL.test(domain)) return null;
  try { domain = new URL(`http://${domain.replaceAll('%', '%25')}`).host; } catch { /* checked as written */ }
  const labels = domain.split('.');
  if (labels.length < 2 || !topLevelDomains().has(labels.at(-1).toLowerCase())) return null;
  if (!labels.every((label, i) => label.length && label.length <= 63 && (i < labels.length - 1 ? LABEL : TLD).test(label))) return null;
  const unicode = labels.map(label => (/^xn--/i.test(label) ? punycode(label.slice(4).toLowerCase()) : label.toLowerCase()));
  return unicode.includes(null) ? null : unicode.join('.');
}

// Lowercased, trimmed and NFC, with the domain as canonicalDomain() reads it,
// so one address never stores as two spellings.
export function normalize(value, path, type) {
  if (typeof value !== 'string' || value.length > MAX_INPUT) return fail(path, type);
  const cleaned = value.toLowerCase().trim().normalize('NFC');
  const address = cleaned.length < 6 || cleaned.length > 128 ? null : canonicalAddress(cleaned);
  if (address === null || address.length < 6 || address.length > 128) return fail(path, type);
  return address;
}
