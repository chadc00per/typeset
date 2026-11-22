// color: hex, rgb() or hsl() (with optional opacity) or transparent, stored as
// lowercase hex, with alpha only when not opaque. Input may come pasted from CSS,
// so tabs and line breaks are whitespace here.
import { fail } from '../lib/errors.js';
import { asciiLower, CONTROL_EXCEPT_WHITESPACE, DECIMAL, text } from '../lib/text.js';

export const definition = {
  name: 'color',
  description: 'Hex, RGB or HSL color with optional opacity; canonical hex',
  example: '#4caf50',
  control: 'color'
};

const HUE = new RegExp(`^(${DECIMAL.source.slice(1, -1)})(deg|grad|rad|turn)?$`);

// One color channel as a fraction of its range.
function component(raw, max, path) {
  const percent = raw.endsWith('%');
  const digits = percent ? raw.slice(0, -1) : raw;
  const n = DECIMAL.test(digits) ? Number(digits) : NaN;
  if (!Number.isFinite(n) || n < 0 || n > (percent ? 100 : max)) return fail(path, 'color');
  return percent ? n / 100 : n / max;
}

export function normalize(value, path, type) {
  const raw = asciiLower(text(value, path, type, { max: 256, control: CONTROL_EXCEPT_WHITESPACE, empty: true }));
  if (raw === 'transparent') return '#00000000';
  if (/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/.test(raw)) {
    let hex = raw.slice(1);
    if (hex.length <= 4) hex = [...hex].map(c => c + c).join('');
    return '#' + (hex.length === 8 && hex.endsWith('ff') ? hex.slice(0, 6) : hex);
  }
  const match = /^(rgb|rgba|hsl|hsla)\((.*)\)$/.exec(raw);
  if (!match) return fail(path, type);
  const legacy = match[2].includes(',');
  const parts = legacy ? match[2].split(',').map(s => s.trim()) : match[2].trim().split(/\s*\/\s*/);
  let channels, alpha;
  if (legacy) {
    if (parts.length !== 3 && parts.length !== 4 || parts.some(p => /[\s/]/.test(p))) return fail(path, type);
    channels = parts.slice(0, 3); alpha = parts[3];
  } else {
    if (parts.length > 2) return fail(path, type);
    channels = parts[0].split(/\s+/); alpha = parts[1];
    if (channels.length !== 3) return fail(path, type);
  }
  let rgb;
  if (match[1].startsWith('rgb')) {
    if (legacy && !channels.every(c => c.endsWith('%') === channels[0].endsWith('%'))) return fail(path, type);
    rgb = channels.map(c => component(c, 255, path));
  } else {
    const hue = HUE.exec(channels[0]);
    if (!hue || !Number.isFinite(Number(hue[1])) || !channels[1].endsWith('%') || !channels[2].endsWith('%')) return fail(path, type);
    const degrees = Number(hue[1]) * ({ deg: 1, grad: 0.9, rad: 180 / Math.PI, turn: 360 }[hue[2] || 'deg']);
    if (!Number.isFinite(degrees)) return fail(path, type);
    const h = ((degrees % 360) + 360) % 360 / 30;
    const s = component(channels[1], 1, path), l = component(channels[2], 1, path);
    const a = s * Math.min(l, 1 - l);
    rgb = [0, 8, 4].map(n => { const k = (n + h) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); });
  }
  const bytes = [...rgb, alpha === undefined ? 1 : component(alpha, 1, path)].map(n => Math.round(n * 255));
  if (bytes[3] === 255) bytes.pop();
  return '#' + bytes.map(n => n.toString(16).padStart(2, '0')).join('');
}
