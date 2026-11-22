// geo: Coordinate pair [longitude, latitude].
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Geo } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('geo is a point on the globe: [lng, lat] within range', () => {
  accepts(Geo, [[[-180, 90], [-180, 90]], [['-73.9857', ' 40.7484 '], [-73.9857, 40.7484]], [[-0, 0], [0, 0]]]);
  assert.throws(() => Geo.normalize([500, 0], 'location'), { message: 'location longitude must be within [-180, 180]' });
  assert.throws(() => Geo.normalize([0, -91]), /latitude must be within \[-90, 90\]/);
  refuses(Geo, [[1], [1, 2, 3], ['a', 'b'], [NaN, 0], '1,2']);
});
