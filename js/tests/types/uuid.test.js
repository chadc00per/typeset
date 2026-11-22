// uuid: UUID of any version, lowercase and hyphenated.
import { test } from 'node:test';
import { Uuid } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('uuid: any version, lowercase hyphenated', () => {
  const canonical = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
  accepts(Uuid, [['{F81D4FAE-7DEC-11D0-A765-00A0C91E6BF6}', canonical], ['urn:uuid:f81d4fae7dec11d0a76500a0c91e6bf6', canonical], ['00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000']]);
  refuses(Uuid, ['f81d4fae-7dec11d0-a765-00a0c91e6bf6', 'f81d4fae-7dec-11d0-a765-00a0c91e6bf', 'g81d4fae-7dec-11d0-a765-00a0c91e6bf6', '{f81d4fae-7dec-11d0-a765-00a0c91e6bf6']);
});
