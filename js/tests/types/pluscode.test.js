// pluscode: Full Open Location Code (plus code), uppercase.
import { test } from 'node:test';
import { PlusCode } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('pluscode: full codes, padding rules', () => {
  accepts(PlusCode, [['849vcwc8+r9', '849VCWC8+R9'], ['849VCW00+', '849VCW00+'], ['84000000+', '84000000+'], ['8FVC9G8F+6XQQ', '8FVC9G8F+6XQQ'], ['C49VCWC8+R9', 'C49VCWC8+R9']]);
  refuses(PlusCode, ['849VCW00+R9', 'CWC8+R9', '849VCWC8+R', '849VCWC8', 'D49VCWC8+R9', '8X9VCWC8+R9', '849V0W00+', '80000000+', '00000000+', '849VCWC8+R9A1234']);
});
