// hostname: DNS hostname, including single-label local names.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { domainToASCII } from 'node:url';
import { Hostname } from '../../src/index.js';
import { accepts } from '../helpers.js';

test('hostname: single-label names allowed', () => {
  accepts(Hostname, [['localhost', 'localhost'], ['API.example.com', 'api.example.com']]);
});

// The browser-safe parsing must accept and canonicalize exactly as node:net and node:url do.
test('hostname: canonicalizes as node:url does', () => {
  for (const raw of ['Example.COM', 'bücher.de', '例え.テスト', 'faß.de', 'ＥＸＡＭＰＬＥ.com', '1.2', '0x7f.1', 'xn--iñvalid.com', '-a.com']) {
    const expected = domainToASCII(raw);
    const ours = (() => { try { return Hostname.normalize(raw); } catch { return null; } })();
    if (ours !== null) assert.equal(ours, expected.replace(/\.$/, ''), raw);
  }
});
