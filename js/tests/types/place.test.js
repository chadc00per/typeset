// place: Opaque Google Place ID (no existence lookup).
import { test } from 'node:test';
import { Place } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('place ids are opaque printable ASCII, kept exactly', () => {
  accepts(Place, [[' ChIJd8BlQ2BZwokRAFUEcm_qrcA ', 'ChIJd8BlQ2BZwokRAFUEcm_qrcA']]);
  refuses(Place, ['', 'a b', 'ünï']);
});
