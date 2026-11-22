// color: Hex, RGB or HSL color with optional opacity; canonical hex.
import { test } from 'node:test';
import { Color } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('color: hex, rgb() or hsl() to canonical lowercase hex', () => {
  accepts(Color, [
    ['#FFF', '#ffffff'], ['#ffffffff', '#ffffff'], ['#0008', '#00000088'], ['transparent', '#00000000'],
    ['rgb(76, 175, 80)', '#4caf50'], ['rgb(76 175 80 / 50%)', '#4caf5080'], ['rgba(0,0,0,0.5)', '#00000080'],
    ['hsl(120, 100%, 50%)', '#00ff00'], ['hsl(0.5turn 100% 50%)', '#00ffff']
  ]);
  refuses(Color, ['red', '#ggg', 'rgb(1,2%,3)', 'rgb(256,0,0)', 'hsl(120, 50, 50)', 'rgb(1 2)', '']);
});

test('color: hls() is not CSS and is refused', () => {
  refuses(Color, ['hls(120, 50%, 25%)', 'hls(120 50% 25%)']);
});
