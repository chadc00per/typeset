// vttrange: WebVTT cue timing "start --> end", the end strictly after the start.
import { cueRange } from '../lib/subtitles.js';

export const definition = {
  name: 'vttrange',
  description: 'WebVTT cue timing with strictly increasing endpoints',
  example: '00:00:00.000 --> 00:00:02.000',
  className: 'VttRange'
};

export function normalize(value, path, type) {
  return cueRange(value, path, type, 'vtt');
}
