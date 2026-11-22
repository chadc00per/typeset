// IP address grammar shared by ip, ipaddress, iprange and uri: node:net's isIP
// grammar, so addresses read the same in a browser as in Node.
// From Node.js lib/internal/net.js (MIT, © Node.js contributors); see THIRD-PARTY-NOTICES.md.
const V4_SEG = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)';
const V4 = `(?:${V4_SEG}\\.){3}${V4_SEG}`;
const V6_SEG = '[0-9a-fA-F]{1,4}';
const IPV4 = new RegExp(`^${V4}$`);
const IPV6 = new RegExp('^(?:' +
  `(?:${V6_SEG}:){7}(?:${V6_SEG}|:)|` +
  `(?:${V6_SEG}:){6}(?:${V4}|:${V6_SEG}|:)|` +
  `(?:${V6_SEG}:){5}(?::${V4}|(?::${V6_SEG}){1,2}|:)|` +
  `(?:${V6_SEG}:){4}(?:(?::${V6_SEG}){0,1}:${V4}|(?::${V6_SEG}){1,3}|:)|` +
  `(?:${V6_SEG}:){3}(?:(?::${V6_SEG}){0,2}:${V4}|(?::${V6_SEG}){1,4}|:)|` +
  `(?:${V6_SEG}:){2}(?:(?::${V6_SEG}){0,3}:${V4}|(?::${V6_SEG}){1,5}|:)|` +
  `(?:${V6_SEG}:){1}(?:(?::${V6_SEG}){0,4}:${V4}|(?::${V6_SEG}){1,6}|:)|` +
  `(?::(?:(?::${V6_SEG}){0,5}:${V4}|(?::${V6_SEG}){1,7}|:))` +
  ')(?:%[0-9a-zA-Z-.:]{1,})?$');

// 4 or 6 for an IPv4 or IPv6 address (a zone id allowed), 0 otherwise.
export function isIP(text) { return IPV4.test(text) ? 4 : IPV6.test(text) ? 6 : 0; }
// An IPv6 address in the WHATWG URL serialization: lowercase, zeros compressed, IPv4 tail as hex.
export function canonicalV6(address) { return new URL(`http://[${address}]/`).hostname.slice(1, -1); }
// A bare address, no port or zone, canonical: '' when it isn't one.
export function address(raw) {
  const version = isIP(raw);
  if (!version || raw.includes('%')) return '';
  return version === 6 ? canonicalV6(raw) : raw;
}
