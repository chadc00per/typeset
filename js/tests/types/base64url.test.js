// base64url: Canonical unpadded RFC 4648 base64url text.
import { test } from 'node:test';
import { Base64Url } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('base64url: url alphabet, unpadded, zero spare bits', () => {
  accepts(Base64Url, [['SGVsbG8-_w==', 'SGVsbG8-_w'], ['SGVsbG8', 'SGVsbG8'], ['', '']]);
  refuses(Base64Url, ['SGVsbG8+', 'SGVsbG8/', 'SGVsbG9', 'A', 'SGVsbG8==', 'SGVsbA=']);
});
