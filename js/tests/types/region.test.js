// region: Registered subdivision code, uppercase and country-qualified.
import { test } from 'node:test';
import { Region } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('region: a registered CLDR subdivision with its country', () => {
  accepts(Region, [['us-ny', 'US-NY'], ['GB-ENG', 'GB-ENG']]);
  refuses(Region, ['US-XX', 'USNY', 'NY']);
});

test('region: lookalikes that case mapping folds into ASCII are refused', () => {
  refuses(Region, ['u\u017f-ny']);
});
