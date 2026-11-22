// DNS name checking shared by domain and hostname.
import { fail } from './errors.js';
import { isIP } from './ip.js';
import { CONTROL_EXCEPT_TAB, text } from './text.js';

// WHATWG domain-to-ASCII (IDNA), the same algorithm as node:url's domainToASCII; '' when invalid
function domainToASCII(text) {
  try { return new URL(`http://${text}`).hostname; } catch { return ''; }
}
// A lowercase ASCII DNS name of at least `labels` labels, without a trailing dot.
export function hostname(value, path, type, { labels: minimum = 1 } = {}) {
  const raw = text(value, path, type, { control: CONTROL_EXCEPT_TAB });
  // Validate syntax before IDNA conversion: domainToASCII also accepts URL-like
  // input and legacy numeric IPv4 spellings, which aren't DNS names here.
  if (/[\s/:@?#%\\[\]]/.test(raw)) return fail(path, type);
  let host = domainToASCII(raw).toLowerCase();
  if (host.endsWith('.')) host = host.slice(0, -1);
  const labels = host.split('.');
  if (!host || host.length > 253 || isIP(host) || /^\d+$/.test(labels.at(-1)) || labels.length < minimum ||
      !labels.every(l => l.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(l))) return fail(path, type);
  return host;
}
