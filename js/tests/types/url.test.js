// url: Absolute HTTP(S) URL.
import { test } from 'node:test';
import { Url } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('url: absolute http(s), WHATWG-serialized', () => {
  accepts(Url, [['https://example.com', 'https://example.com/'], ['HTTP://Example.COM/a?b=1', 'http://example.com/a?b=1']]);
  refuses(Url, ['ftp://x', 'example.com', 'https://u:p@x.com', 'https://x.com/a b', 'https://x.com/%zz', 'https://']);
});
