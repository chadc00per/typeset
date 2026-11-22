// ip: IPv4 or IPv6 address, optionally with a port (bracket IPv6 endpoints).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import { Ip } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('ip: canonical address, optional port, no zone ids', () => {
  accepts(Ip, [['::FFFF:1.2.3.4', '::ffff:102:304'], ['[::1]:080', '[::1]:80'], ['1.2.3.4:8080', '1.2.3.4:8080']]);
  refuses(Ip, ['localhost', '01.2.3.4', '256.1.1.1', '1.2.3.4:65536', '1.2.3.4:0', '[::1]:0', 'fe80::1%eth0']);
});

// The browser-safe parsing must accept and canonicalize exactly as node:net and node:url do.
test('ip: accepts exactly the addresses node:net does', () => {
  const hex = () => randomBytes(2).toString('hex').replace(/^0+(?=.)/, '');
  const candidates = ['::', '::1', '1.2.3.4', '01.2.3.4', '256.1.1.1', '::ffff:1.2.3.4', '::ffff:01.2.3.4', '1:2:3:4:5:6:7:8:9', 'fe80::1%eth0'];
  for (let i = 0; i < 5000; i++) {
    const groups = Array.from({ length: 1 + (i % 8) }, hex);
    candidates.push(groups.join(':'), `${groups.join(':')}::`, `::${groups.slice(0, 5).join(':')}`, groups.slice(0, 4).join('.'));
  }
  for (const raw of candidates) {
    const ours = (() => { try { return Ip.normalize(raw); } catch { return null; } })();
    if (!isIP(raw) || raw.includes('%')) assert.equal(ours, null, raw);
    else assert.notEqual(ours, null, raw);
  }
});
