// uri: Absolute RFC 3986 URI of any scheme (mailto:, tel:, urn:, s3://…).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Uri } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('uri: any scheme, RFC 3986 normal form', () => {
  accepts(Uri, [
    ['mailto:Ada@Example.com', 'mailto:Ada@Example.com'],
    ['tel:+1-212-555-0123', 'tel:+1-212-555-0123'],
    ['S3://My-Bucket/Key%2fa%7e', 's3://my-bucket/Key%2Fa~'],
    ['urn:isbn:0451450523', 'urn:isbn:0451450523'],
    ['HTTP://[2001:DB8::1]:080/a', 'http://[2001:db8::1]:80/a'],
    ['https://u@X.com:/', 'https://u@x.com/'],
    ['file:///etc/hosts', 'file:///etc/hosts'],
    ['x:/a/./b/../c', 'x:/a/c'], ['http://x/a/b/../../../c', 'http://x/c'], ['http://x/a/.', 'http://x/a/'],
    ['http://x/a/..?q=/./#/../f', 'http://x/?q=/./#/../f'], ['http://x/%2E%2E/a', 'http://x/a'], ['urn:a/../b', 'urn:a/../b']
  ]);
  refuses(Uri, ['x:', 'a b:c', '//x.com', 'example.com', 'https://u:p@x.com', 'http://x/a#b#c', 'http://x/ü', 'http://x/%zz', 'http://x/[a]', 'http://[::1%eth0]/']);
});

test('uri: removing dot segments never turns a path into an authority', () => {
  assert.equal(Uri.normalize('foo:/.//evil.com/x'), 'foo:/.//evil.com/x');
  assert.equal(Uri.normalize('foo:/a/..//evil.com'), 'foo:/.//evil.com');
  assert.equal(Uri.normalize('foo://host/..//x'), 'foo://host//x');
});
