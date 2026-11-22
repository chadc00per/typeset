// mimetype: Bare media type without parameters or wildcards.
import { test } from 'node:test';
import { MimeType } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('mimetype: a bare media type, lowercase', () => {
  accepts(MimeType, [['Video/MP4', 'video/mp4']]);
  refuses(MimeType, ['text/plain; charset=utf-8', 'text', 'text/*/x']);
});
