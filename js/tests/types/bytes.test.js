// bytes: Data size in whole bytes; SI (kB) and IEC (KiB) units accepted.
import { test } from 'node:test';
import { Bytes } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('bytes: SI and IEC units to whole bytes; a lowercase b is bits', () => {
  accepts(Bytes, [['1.5 kB', 1500], ['1 KiB', 1024], ['2 GiB', 2147483648], ['512', 512], ['3 bytes', 3], ['10B', 10], [4096, 4096]]);
  refuses(Bytes, ['10b', '10 mb', '10 Mb', '1 mB', '1 gB', '0.5 B', '-1 kB', -1, 1.5, '1 ZB', '9 EB']);
});
