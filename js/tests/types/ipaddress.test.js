// ipaddress: IPv4 or IPv6 address, no port or zone.
import { test } from 'node:test';
import { IpAddress } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('ipaddress: an address alone, no port or zone', () => {
  accepts(IpAddress, [['2001:DB8::0001', '2001:db8::1'], ['10.0.0.1', '10.0.0.1']]);
  refuses(IpAddress, ['1.2.3.4:80', '[::1]', '[::1]:80', 'fe80::1%eth0', '01.2.3.4']);
});
