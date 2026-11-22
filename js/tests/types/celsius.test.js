// celsius: Celsius temperature string, explicit °C, at or above absolute zero.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Celsius } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('celsius: explicit °C, at or above absolute zero', () => {
  accepts(Celsius, [['52 c', '52°C'], ['-273.15°C', '-273.15°C'], ['-0°C', '0°C'], ['007.50°C', '7.5°C']]);
  refuses(Celsius, ['-273.16°C', '52°F', '52', '1e2°C']);
  assert.throws(() => Celsius.normalize('52°F'), { message: 'celsius must be a valid Celsius temperature (use °C)' });
});
