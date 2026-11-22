// srtrange: SubRip cue timing "start --> end", the end strictly after the start.
import { cueRange } from '../lib/subtitles.js';

export const definition = {
  name: 'srtrange',
  description: 'SubRip cue timing with strictly increasing endpoints',
  example: '00:00:01,000 --> 00:00:04,000',
  className: 'SrtRange'
};

export function normalize(value, path, type) {
  return cueRange(value, path, type, 'srt');
}
