// iprange: IPv4 or IPv6 CIDR block, network address with zero host bits.
import { test } from 'node:test';
import { IpRange } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('iprange: a CIDR block with zero host bits', () => {
  accepts(IpRange, [
    ['10.0.0.0/8', '10.0.0.0/8'], ['2001:DB8::/32', '2001:db8::/32'], ['1.2.3.4', '1.2.3.4/32'],
    ['::1', '::1/128'], ['0.0.0.0/0', '0.0.0.0/0'], ['::/0', '::/0'], ['::ffff:1.2.3.0/120', '::ffff:102:300/120']
  ]);
  refuses(IpRange, ['10.0.0.5/8', '2001:db8::1/32', '1.2.3.0/33', '::/129', '1.2.3.0/024', '1.2.3.0/', 'localhost/8', '1.2.3.0/8/8']);
});
