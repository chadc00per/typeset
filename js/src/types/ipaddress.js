// ipaddress: an IPv4 or IPv6 address alone, canonical; no port or zone.
import { fail } from '../lib/errors.js';
import { address } from '../lib/ip.js';
import { CONTROL_EXCEPT_TAB, text } from '../lib/text.js';

export const definition = {
  name: 'ipaddress',
  description: 'IPv4 or IPv6 address, no port or zone',
  example: '2001:db8::1',
  className: 'IpAddress'
};

export function normalize(value, path, type) {
  return address(text(value, path, type, { control: CONTROL_EXCEPT_TAB })) || fail(path, type, 'address without a port');
}
