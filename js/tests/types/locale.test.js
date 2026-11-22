// locale: Canonical Unicode BCP 47 locale identifier.
import { test } from 'node:test';
import { Locale } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('locale: canonical BCP 47 with registered subtags', () => {
  accepts(Locale, [['en_us', 'en-US'], ['ZH-hant-tw', 'zh-Hant-TW'], ['de-DE-1996', 'de-DE-1996']]);
  refuses(Locale, ['xx-US', 'en-ZZ', 'en-Qaaa-US-fakevar', '']);
});
