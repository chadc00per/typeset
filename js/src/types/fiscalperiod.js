// fiscalperiod: FYyyyy, FYyyyy-Q1..Q4 or a calendar month yyyy-mm, uppercase;
// no fiscal calendar is inferred.
import { fail } from '../lib/errors.js';
import { asciiUpper, text } from '../lib/text.js';

export const definition = {
  name: 'fiscalperiod',
  description: 'Fiscal year/quarter label or calendar month; no calendar inference',
  example: 'FY2026-Q2',
  className: 'FiscalPeriod'
};

export function normalize(value, path, type) {
  const raw = asciiUpper(text(value, path, type, { max: 32, control: null, empty: true }));
  const fy = /^FY(\d{4})(?:-Q([1-4]))?$/.exec(raw);
  if (fy && Number(fy[1]) > 0) return raw;
  const month = /^(\d{4})-(\d{1,2})$/.exec(raw);
  if (month && Number(month[1]) > 0 && Number(month[2]) >= 1 && Number(month[2]) <= 12) return `${month[1]}-${month[2].padStart(2, '0')}`;
  return fail(path, type, 'FYyyyy, FYyyyy-Q1..4 or yyyy-mm');
}
