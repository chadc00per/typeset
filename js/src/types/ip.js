// ip: an IPv4 or IPv6 address, optionally with a port 1–65535; an IPv6
// address with a port is bracketed. Zone ids are refused: a scoped address
// depends on local interfaces, so it isn't a portable IP.
import { fail } from '../lib/errors.js';
import { canonicalV6, isIP } from '../lib/ip.js';
import { CONTROL_EXCEPT_TAB, text } from '../lib/text.js';

export const definition = {
  name: 'ip',
  description: 'IPv4 or IPv6 address, optionally with a port (bracket IPv6 endpoints)',
  example: '192.168.1.100:8080'
};

export function normalize(value, path, type) {
  const raw = text(value, path, type, { control: CONTROL_EXCEPT_TAB });
  let address = raw, port;
  if (raw.startsWith('[')) {
    const match = /^\[([^\]]+)\](?::(\d+))?$/.exec(raw);
    if (!match || isIP(match[1]) !== 6) return fail(path, type);
    [, address, port] = match;
  } else if (!isIP(raw)) {
    const match = /^([^:]+):(\d+)$/.exec(raw);
    if (!match || isIP(match[1]) !== 4) return fail(path, type);
    [, address, port] = match;
  }
  const version = isIP(address);
  if (!version || address.includes('%') || (port !== undefined && (port.length > 5 || Number(port) < 1 || Number(port) > 65535))) return fail(path, type);
  const canonical = version === 6 ? canonicalV6(address) : address;
  if (port !== undefined) return `${version === 6 ? `[${canonical}]` : canonical}:${Number(port)}`;
  return canonical;
}
