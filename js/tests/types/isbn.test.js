// isbn: Checksum-validated ISBN-10 or ISBN-13, stored as ISBN-13.
import { test } from 'node:test';
import { Isbn } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('isbn: checksum-validated, stored as ISBN-13', () => {
  accepts(Isbn, [['0131103628', '9780131103627'], ['978-0-13-110362-7', '9780131103627'], ['080442957x', '9780804429573']]);
  refuses(Isbn, ['0131103627', '9780131103620', '9790000000001', '978013110362']);
});
