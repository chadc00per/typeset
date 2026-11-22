// geojson: RFC 7946 GeoJSON geometry, Feature or FeatureCollection.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GeoJson } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('geojson: RFC 7946 geometries, Features and FeatureCollections', () => {
  const point = { type: 'Point', coordinates: [-73.9857, 40.7484] };
  const square = [[0, 0], [1, 0], [1, 1], [0, 0]];
  accepts(GeoJson, [
    [JSON.stringify(point), point],
    [{ type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] } }, { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: null }],
    [{ type: 'MultiPolygon', coordinates: [[square]] }, { type: 'MultiPolygon', coordinates: [[square]] }],
    [{ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: null, properties: { a: 1 }, id: 'x' }], name: 'kept' }, { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: null, properties: { a: 1 }, id: 'x' }], name: 'kept' }],
    [{ type: 'GeometryCollection', geometries: [point], bbox: [-74, 40, -73, 41] }, { type: 'GeometryCollection', geometries: [point], bbox: [-74, 40, -73, 41] }]
  ]);
  refuses(GeoJson, [
    { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1]]] },
    { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [0, 0]]] },
    { type: 'MultiPolygon', coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 1]]]] },
    { type: 'LineString', coordinates: [[0, 0]] },
    { type: 'Point', coordinates: [200, 0] },
    { type: 'Point', coordinates: [0, 0, 0, 0] },
    { type: 'Point', coordinates: ['0', 0] },
    { type: 'Circle', coordinates: [0, 0] },
    { type: 'Point', coordinates: [0, 0], bbox: [1, 2, 3] },
    { type: 'FeatureCollection', features: [point] },
    { type: 'Feature', geometry: point, properties: [] },
    '{not json', [0, 0]
  ]);
});

test('geojson: holes and non-finite numbers are refused, not turned into null', () => {
  /* eslint-disable no-sparse-arrays */
  refuses(GeoJson, [
    { type: 'Point', coordinates: [, 1] },
    { type: 'Point', coordinates: [0, 0], bbox: [0, , 0, 0] },
    { type: 'LineString', coordinates: [[0, 0], , [1, 1]] },
    { type: 'Feature', geometry: null, properties: { n: Infinity } },
    { type: 'Point', coordinates: [0, 0], weight: NaN }
  ]);
  /* eslint-enable no-sparse-arrays */
});

test('geojson: arrays and objects nest at most 64 deep, as text or as a value', () => {
  const member = n => `{"type":"Point","coordinates":[0,0],"x":${'['.repeat(n)}${']'.repeat(n)}}`;
  accepts(GeoJson, [[member(63), JSON.parse(member(63))]]);
  refuses(GeoJson, [member(64), member(100000), JSON.parse(member(64)), `{"x":${'['.repeat(65)}`]);
  const cycle = { type: 'Point', coordinates: [0, 0] };
  cycle.self = cycle;
  assert.throws(() => GeoJson.normalize(cycle), { message: 'geojson must be a valid GeoJSON (nested at most 64 levels deep)' });
});
