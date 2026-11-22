// cron: Five-field cron expression, numeric or abbreviated month/weekday names.
import { test } from 'node:test';
import { Cron } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('cron: five fields, names read as numbers, structure kept', () => {
  accepts(Cron, [['0 9 * * 1-5', '0 9 * * 1-5'], ['0 0 1 jan sun', '0 0 1 1 0'], ['*/5\t* * * *', '*/5 * * * *'], ['0 0 * * 7', '0 0 * * 0'], ['0 0 * * 5-7', '0 0 * * 5-7']]);
  refuses(Cron, ['* * * *', '0 0 * * 8', '5-1 * * * *', '1/5 * * * *', '* * * * * cmd', '0 0 * * MON\n']);
});

test('cron: a list is a set of terms, stored once each and in order', () => {
  accepts(Cron, [
    ['0 0 * * 0,7', '0 0 * * 0'], ['0 0 * * sun,7', '0 0 * * 0'], ['0 0 1,1 * *', '0 0 1 * *'],
    ['15,1 * * * *', '1,15 * * * *'], ['0 0 * * 5-7,1', '0 0 * * 1,5-7'], ['0 0 * * 7,mon', '0 0 * * 0,1'],
    ['*/015 00-023/02 01,15 jan,DEC sun,7', '*/15 0-23/2 1,15 1,12 0'], ['1-5/2,1-5,1-3,*/5 * * * *', '*/5,1-3,1-5,1-5/2 * * * *']
  ]);
});

test('cron: lookalikes that case mapping folds into ASCII are refused', () => {
  refuses(Cron, ['0 0 1 jan \u017fun', '0 0 1 \ufb00 *']);
});
