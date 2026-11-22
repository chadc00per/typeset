// uri: any absolute URI (mailto:, tel:, urn:, s3://…), RFC 3986 syntax.
// Normalized as RFC 3986 section 6.2.2 allows without knowing the scheme:
// lowercase scheme and host, percent-encodings normalized, an empty port
// dropped, dot segments removed from a path that starts with '/' (a rootless
// one, as in urn:, is opaque). Non-ASCII must be percent-encoded; a password in
// the userinfo is refused.
import { fail } from '../lib/errors.js';
import { canonicalV6, isIP } from '../lib/ip.js';
import { CONTROL_EXCEPT_TAB, text } from '../lib/text.js';

export const definition = {
  name: 'uri',
  description: 'Absolute RFC 3986 URI of any scheme (mailto:, tel:, urn:, s3://…)',
  example: 'mailto:ada@example.com',
  control: 'url'
};

// A scheme, then only unreserved, reserved and percent-encoded characters.
const URI = /^([A-Za-z][A-Za-z0-9+.-]*):([A-Za-z0-9\-._~!$&'()*+,;=:@/?#[\]%]+)$/;
const UNRESERVED = /[A-Za-z0-9\-._~]/;

// Percent-encodings in RFC 3986 normal form: unreserved characters decoded, hex uppercase.
function percentNormal(text) {
  return text.replace(/%([0-9A-Fa-f]{2})/g, (_, hex) => {
    const char = String.fromCharCode(parseInt(hex, 16));
    return UNRESERVED.test(char) ? char : `%${hex.toUpperCase()}`;
  });
}
// RFC 3986 section 5.2.4: "." and ".." segments resolved out of an absolute path.
function removeDotSegments(path) {
  const out = [];
  const segments = path.split('/');
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i], last = i === segments.length - 1;
    if (segment === '.' || segment === '..') {
      if (segment === '..') out.pop();
      if (last) out.push('');
    } else out.push(segment);
  }
  return '/' + out.join('/');
}

export function normalize(value, path, type) {
  const m = URI.exec(text(value, path, type, { control: CONTROL_EXCEPT_TAB }));
  if (!m || /%(?![0-9A-Fa-f]{2})/.test(m[2])) return fail(path, type);
  const rest = m[2];
  const fragment = rest.indexOf('#');
  if (fragment !== -1 && rest.includes('#', fragment + 1)) return fail(path, type);
  let authority = '', tail = rest;
  if (rest.startsWith('//')) {
    const end = rest.slice(2).search(/[/?#]/);
    const raw = end === -1 ? rest.slice(2) : rest.slice(2, 2 + end);
    tail = end === -1 ? '' : rest.slice(2 + end);
    const at = raw.lastIndexOf('@');
    const userinfo = at === -1 ? null : raw.slice(0, at);
    if (userinfo !== null && /[:@[\]]/.test(userinfo)) return fail(path, type, 'no password in the URI');
    const literal = /^\[([^\]]+)\](?::(\d*))?$/.exec(raw.slice(at + 1));
    const named = literal ? null : /^([^:[\]]*)(?::(\d*))?$/.exec(raw.slice(at + 1));
    let host, port;
    if (literal) {
      if (isIP(literal[1]) !== 6 || literal[1].includes('%')) return fail(path, type);
      [host, port] = [`[${canonicalV6(literal[1])}]`, literal[2]];
    } else if (named) [host, port] = [percentNormal(percentNormal(named[1]).toLowerCase()), named[2]];
    else return fail(path, type);
    authority = `//${userinfo === null ? '' : percentNormal(userinfo) + '@'}${host}${port ? ':' + port.replace(/^0+(?=\d)/, '') : ''}`;
  }
  if (/[[\]]/.test(tail)) return fail(path, type);
  tail = percentNormal(tail);
  const split = tail.search(/[?#]/), hierarchical = split === -1 ? tail : tail.slice(0, split);
  if (hierarchical.startsWith('/')) tail = removeDotSegments(hierarchical) + (split === -1 ? '' : tail.slice(split));
  // Without an authority, a path that now starts with "//" would read back as
  // one ("foo:/.//evil.com" → "foo://evil.com"); RFC 3986 section 5.3 keeps it a path with "/.".
  if (!authority && tail.startsWith('//')) tail = '/.' + tail;
  return `${m[1].toLowerCase()}:${authority}${tail}`;
}
