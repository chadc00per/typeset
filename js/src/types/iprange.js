// iprange: a CIDR block, its network address and prefix length. A bare
// address is a one-address block (/32 or /128). Host bits must be zero rather
// than being masked off, so "10.0.0.5/8" is refused instead of silently
// becoming 10.0.0.0/8.
import { fail } from '../lib/errors.js';
import { address, canonicalV6 } from '../lib/ip.js';
import { CONTROL_EXCEPT_TAB, text } from '../lib/text.js';

export const definition = {
  name: 'iprange',
  description: 'IPv4 or IPv6 CIDR block, network address with zero host bits',
  example: '10.0.0.0/8',
  className: 'IpRange'
};

// An address as an integer of its 32 or 128 bits, and back.
function toBits(canonical) {
  if (!canonical.includes(':')) return canonical.split('.').reduce((n, octet) => (n << 8n) | BigInt(octet), 0n);
  const [head, tail] = canonical.split('::');
  const left = head ? head.split(':') : [], right = tail ? tail.split(':') : [];
  const groups = tail === undefined ? left : [...left, ...Array(8 - left.length - right.length).fill('0'), ...right];
  return groups.reduce((n, group) => (n << 16n) | BigInt(`0x${group}`), 0n);
}
function fromBits(n, version) {
  if (version === 4) return [24n, 16n, 8n, 0n].map(shift => String((n >> shift) & 255n)).join('.');
  return canonicalV6(Array.from({ length: 8 }, (_, i) => ((n >> BigInt(112 - 16 * i)) & 0xffffn).toString(16)).join(':'));
}

export function normalize(value, path, type) {
  const m = /^([^/]+)(?:\/(0|[1-9]\d{0,2}))?$/.exec(text(value, path, type, { control: CONTROL_EXCEPT_TAB }));
  const canonical = m && address(m[1]);
  if (!canonical) return fail(path, type, 'CIDR block such as 10.0.0.0/8');
  const version = canonical.includes(':') ? 6 : 4, bits = version === 4 ? 32 : 128;
  const prefix = m[2] === undefined ? bits : Number(m[2]);
  if (prefix > bits) return fail(path, type, `prefix 0..${bits}`);
  const n = toBits(canonical);
  if (n & ((1n << BigInt(bits - prefix)) - 1n)) return fail(path, type, 'host bits must be zero');
  return `${fromBits(n, version)}/${prefix}`;
}
