// uuidv4: a random (version 4, RFC 9562 variant) UUID, lowercase hyphenated.
import { test } from 'node:test';
import { UuidV4 } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('uuidv4: version 4 and the RFC 9562 variant only, lowercase hyphenated', () => {
  const canonical = 'f81d4fae-7dec-41d0-a765-00a0c91e6bf6';
  accepts(UuidV4, [['{F81D4FAE-7DEC-41D0-A765-00A0C91E6BF6}', canonical], ['urn:uuid:f81d4fae7dec41d0a76500a0c91e6bf6', canonical],
    ['9b2e4f1c-6d3a-4e8b-9c71-2f5a8d0e3b64', '9b2e4f1c-6d3a-4e8b-9c71-2f5a8d0e3b64'], ['9b2e4f1c-6d3a-4e8b-bc71-2f5a8d0e3b64', '9b2e4f1c-6d3a-4e8b-bc71-2f5a8d0e3b64']]);
  refuses(UuidV4, ['f81d4fae-7dec-11d0-a765-00a0c91e6bf6', '01890a5d-ac96-774b-bcce-b302099a8057', '00000000-0000-0000-0000-000000000000',
    '9b2e4f1c-6d3a-4e8b-7c71-2f5a8d0e3b64', '9b2e4f1c-6d3a-4e8b-cc71-2f5a8d0e3b64', 'f81d4fae-7dec41d0-a765-00a0c91e6bf6', 'g81d4fae-7dec-41d0-a765-00a0c91e6bf6']);
});
