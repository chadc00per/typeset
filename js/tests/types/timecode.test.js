// timecode: SMPTE timecode HH:MM:SS:FF; a ; before the frames marks 29.97 drop-frame.
import { test } from 'node:test';
import { Timecode } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('timecode: SMPTE, non-drop and 29.97 drop-frame', () => {
  accepts(Timecode, [['10:00:00:59', '10:00:00:59'], ['01:02:03.04', '01:02:03;04'], ['00:10:00;00', '00:10:00;00'], ['00:01:00;02', '00:01:00;02']]);
  refuses(Timecode, ['00:01:00;00', '00:01:00;01', '00:00:00;30', '00:00:00:60', '24:00:00:00', '1:00:00:00', '00:60:00:00']);
});
