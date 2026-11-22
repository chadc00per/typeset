// contenttype: Media type with optional parameters.
import { test } from 'node:test';
import { ContentType } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('contenttype: sorted, canonical parameters', () => {
  accepts(ContentType, [['Text/Plain; Charset=UTF-8; a="b c"', 'text/plain; a="b c"; charset=utf-8'], ['a/b;\tx="y"', 'a/b; x=y'], ['text/plain;', 'text/plain'], ['a/b;; c=d ;', 'a/b; c=d']]);
  refuses(ContentType, ['text/plain;a=1;a=2', 'text/plain; =x', 'text/plain; a']);
});
