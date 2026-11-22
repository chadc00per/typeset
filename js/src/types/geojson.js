// geojson: an RFC 7946 geometry, Feature or FeatureCollection, as an object or
// JSON text. Positions are [longitude, latitude] or with an altitude, on the
// globe; line strings need two positions and polygon rings four, closed.
// Foreign members are kept, but a non-finite number in one is refused. Ring
// winding isn't checked (RFC 7946 tells parsers not to refuse it). A Feature
// without geometry or properties gets null. The stored value is the input as
// JSON would carry it.
import { fail } from '../lib/errors.js';
import { CONTROL_EXCEPT_WHITESPACE, text } from '../lib/text.js';

export const definition = {
  name: 'geojson',
  description: 'RFC 7946 GeoJSON geometry, Feature or FeatureCollection',
  example: '{"type":"Point","coordinates":[-73.9857,40.7484]}',
  storage: 'object',
  constraints: 'none',
  control: 'json',
  className: 'GeoJson'
};

// Geometry types by what their coordinates nest: 0 a position, 1 a list of them, and so on.
const GEOMETRY_DEPTH = { Point: 0, MultiPoint: 1, LineString: 1, MultiLineString: 2, Polygon: 2, MultiPolygon: 3 };
// GeometryCollections inside GeometryCollections, which RFC 7946 discourages, nest at most this deep.
const MAX_COLLECTION_DEPTH = 8;
// Arrays and objects nest at most this deep, foreign members included. Checked
// without recursion before anything else, so the answer never depends on how
// deep a runtime's JSON parser or serializer can recurse.
const MAX_NESTING = 64;
const NESTING = `nested at most ${MAX_NESTING} levels deep`;

// Whether JSON text opens more than MAX_NESTING arrays and objects at once.
function tooDeepText(raw) {
  let depth = 0, string = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (string) { if (c === '\\') i++; else if (c === '"') string = false; }
    else if (c === '"') string = true;
    else if (c === '[' || c === '{') { if (++depth > MAX_NESTING) return true; }
    else if (c === ']' || c === '}') depth--;
  }
  return false;
}

const BOXED = new Set(['[object String]', '[object Number]', '[object Boolean]']);
// Whether a value holds arrays and objects more than MAX_NESTING deep (a cycle always does).
function tooDeepValue(value) {
  const stack = [[value, 1]];
  while (stack.length) {
    const [v, depth] = stack.pop();
    // Boxed primitives and values with toJSON (Dates) are leaves: JSON writes them as one value.
    if (v === null || typeof v !== 'object' || typeof v.toJSON === 'function' || BOXED.has(Object.prototype.toString.call(v))) continue;
    if (depth > MAX_NESTING) return true;
    for (const key of Object.keys(v)) stack.push([v[key], depth + 1]);
  }
  return false;
}

export function normalize(value, path, type) {
  if (typeof value === 'string') {
    const raw = text(value, path, type, { max: 16 * 1024 * 1024, control: CONTROL_EXCEPT_WHITESPACE });
    if (tooDeepText(raw)) return fail(path, type, NESTING);
    try { value = JSON.parse(raw); } catch { return fail(path, type, 'JSON'); }
  } else if (tooDeepValue(value)) return fail(path, type, NESTING);
  const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const bbox = (v, at) => {
    if (v.bbox !== undefined && (!Array.isArray(v.bbox) || ![4, 6].includes(v.bbox.length) || !Array.from(v.bbox).every(n => typeof n === 'number' && Number.isFinite(n)))) fail(`${at}.bbox`, type, '4 or 6 finite numbers');
  };
  const position = (p, at) => {
    if (!Array.isArray(p) || p.length < 2 || p.length > 3 || !Array.from(p).every(n => typeof n === 'number' && Number.isFinite(n))) return fail(at, type, '[longitude, latitude] or with altitude');
    if (p[0] < -180 || p[0] > 180 || p[1] < -90 || p[1] > 90) return fail(at, type, 'longitude within [-180, 180], latitude within [-90, 90]');
  };
  const coordinates = (c, depth, kind, at) => {
    if (depth === 0) return position(c, at);
    if (!Array.isArray(c)) return fail(at, type, 'coordinate array');
    if (depth === 1 && kind === 'LineString' && c.length < 2) return fail(at, type, 'at least two positions');
    if (depth === 1 && kind === 'ring') {
      if (c.length < 4) return fail(at, type, 'closed ring of at least four positions');
      if (Array.isArray(c[0]) && JSON.stringify(c[0]) !== JSON.stringify(c.at(-1))) return fail(at, type, 'closed ring: last position equals the first');
    }
    const inner = (kind === 'Polygon' && depth === 2) || (kind === 'MultiPolygon' && depth === 2) ? 'ring'
      : kind === 'MultiLineString' && depth === 2 ? 'LineString' : kind;
    for (let i = 0; i < c.length; i++) coordinates(c[i], depth - 1, inner, `${at}[${i}]`);
  };
  const geometry = (g, at, nesting = 0) => {
    if (!plain(g)) return fail(at, type, 'geometry object');
    bbox(g, at);
    if (g.type === 'GeometryCollection') {
      if (!Array.isArray(g.geometries) || nesting >= MAX_COLLECTION_DEPTH) return fail(`${at}.geometries`, type, 'array of geometries');
      for (let i = 0; i < g.geometries.length; i++) geometry(g.geometries[i], `${at}.geometries[${i}]`, nesting + 1);
      return;
    }
    if (!Object.hasOwn(GEOMETRY_DEPTH, g.type)) return fail(`${at}.type`, type, 'GeoJSON type');
    coordinates(g.coordinates, GEOMETRY_DEPTH[g.type], g.type, `${at}.coordinates`);
  };
  const feature = (f, at) => {
    if (!plain(f) || f.type !== 'Feature') return fail(at, type, 'Feature');
    bbox(f, at);
    if (f.geometry !== null && f.geometry !== undefined) geometry(f.geometry, `${at}.geometry`);
    if (f.properties !== null && f.properties !== undefined && !plain(f.properties)) return fail(`${at}.properties`, type, 'object or null');
    if (f.id !== undefined && typeof f.id !== 'string' && !(typeof f.id === 'number' && Number.isFinite(f.id))) return fail(`${at}.id`, type, 'string or number');
    return { ...f, geometry: f.geometry ?? null, properties: f.properties ?? null };
  };
  if (!plain(value)) return fail(path, type, 'GeoJSON object');
  let result = value;
  if (value.type === 'Feature') result = feature(value, path);
  else if (value.type === 'FeatureCollection') {
    bbox(value, path);
    if (!Array.isArray(value.features)) return fail(`${path}.features`, type, 'array of Features');
    result = { ...value, features: Array.from(value.features, (f, i) => feature(f, `${path}.features[${i}]`)) };
  } else geometry(value, path);
  // JSON would turn NaN and Infinity into null, losing them silently.
  let json, lossy = false;
  try { json = JSON.stringify(result, (key, v) => { if (typeof v === 'number' && !Number.isFinite(v)) lossy = true; return v; }); }
  catch { return fail(path, type, 'JSON-serializable'); }
  if (lossy) return fail(path, type, 'finite numbers only');
  return JSON.parse(json);
}
