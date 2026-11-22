// vatnumber: a VAT number with its two-letter prefix, uppercase, without spaces,
// dots or hyphens. The structures are those the EU's VIES service documents, plus
// Northern Ireland (XI), the UK, Switzerland and Norway: structure only, except the
// Swiss and Norwegian check digits, and no registry lookup. GR is read as Greece's
// EL; Swiss numbers drop the MWST/TVA/IVA language suffix (CHE123456789) and
// Norwegian ones carry MVA.
import { fail } from '../lib/errors.js';
import { asciiUpper, text } from '../lib/text.js';

export const definition = {
  name: 'vatnumber',
  description: 'VAT number with its country prefix (EU, XI, GB, CH, NO); structural check',
  example: 'DE123456789',
  className: 'VatNumber'
};

const VAT = {
  AT: /^U\d{8}$/, BE: /^[01]\d{9}$/, BG: /^\d{9,10}$/, CY: /^\d{8}[A-Z]$/, CZ: /^\d{8,10}$/, DE: /^\d{9}$/,
  DK: /^\d{8}$/, EE: /^\d{9}$/, EL: /^\d{9}$/, ES: /^[A-Z0-9]\d{7}[A-Z0-9]$/, FI: /^\d{8}$/, FR: /^[A-HJ-NP-Z0-9]{2}\d{9}$/,
  HR: /^\d{11}$/, HU: /^\d{8}$/, IE: /^(?:\d{7}[A-W][A-I]?|\d[A-Z+*]\d{5}[A-W])$/, IT: /^\d{11}$/, LT: /^(?:\d{9}|\d{12})$/,
  LU: /^\d{8}$/, LV: /^\d{11}$/, MT: /^\d{8}$/, NL: /^\d{9}B\d{2}$/, PL: /^\d{10}$/, PT: /^\d{9}$/, RO: /^[1-9]\d{1,9}$/,
  SE: /^\d{10}01$/, SI: /^\d{8}$/, SK: /^\d{10}$/,
  XI: /^(?:\d{9}|\d{12}|GD[0-4]\d{2}|HA[5-9]\d{2})$/, GB: /^(?:\d{9}|\d{12}|GD[0-4]\d{2}|HA[5-9]\d{2})$/,
  CH: /^E\d{9}$/, NO: /^\d{9}$/
};

// Mod 11 with descending weights, as the Swiss UID and Norwegian organization numbers use.
function mod11(digits, weights) {
  const check = 11 - [...weights].reduce((sum, w, i) => sum + Number(digits[i]) * w, 0) % 11;
  return check === 11 ? '0' : check === 10 ? null : String(check);
}

export function normalize(value, path, type) {
  let raw = asciiUpper(text(value, path, type, { max: 64 })).replace(/[\s.-]/g, '');
  if (raw.startsWith('GR')) raw = 'EL' + raw.slice(2);
  if (raw.startsWith('CHE')) raw = raw.replace(/(?:MWST|TVA|IVA)$/, '');
  if (raw.startsWith('NO')) raw = raw.replace(/MVA$/, '');
  const prefix = raw.slice(0, 2), number = raw.slice(2);
  if (!Object.hasOwn(VAT, prefix) || !VAT[prefix].test(number)) return fail(path, type);
  if (prefix === 'CH' && mod11(number.slice(1), '54327654') !== number.at(-1)) return fail(path, type, 'check digit');
  if (prefix === 'NO' && mod11(number, '32765432') !== number.at(-1)) return fail(path, type, 'check digit');
  return prefix === 'NO' ? `${raw}MVA` : raw;
}
