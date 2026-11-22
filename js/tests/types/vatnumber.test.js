// vatnumber: VAT number with its country prefix (EU, XI, GB, CH, NO); structural check.
import { test } from 'node:test';
import { VatNumber } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('vatnumber: country prefix and structure, Swiss and Norwegian check digits', () => {
  accepts(VatNumber, [
    ['DE 123 456 789', 'DE123456789'], ['GR123456789', 'EL123456789'], ['nl123456789b01', 'NL123456789B01'],
    ['CHE-116.281.710 MWST', 'CHE116281710'], ['NO 974 760 673 MVA', 'NO974760673MVA'], ['GB123456789', 'GB123456789'], ['ATU12345678', 'ATU12345678']
  ]);
  refuses(VatNumber, ['US123456789', 'DE12345678', 'CHE-116.281.711', 'NO974760674', 'AT12345678', '123456789']);
});
