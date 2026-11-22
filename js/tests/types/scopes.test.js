// scopes: Access scope grants "scope:read|write", one per scope at its highest level, sorted.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Scopes } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('scopes: one grant per scope at its highest level, sorted', () => {
  accepts(Scopes, [
    [['billing:read', 'billing:write', 'reports:read'], ['billing:write', 'reports:read']],
    [{ billing: 'update', default: 'read' }, ['billing:write', 'default:read']],
    ['b:read,a:read', ['a:read', 'b:read']]
  ]);
  refuses(Scopes, [['billing'], ['read:read'], ['a:b:c'], ['billing:delete'], { billing: 1 }]);
  assert.equal(Scopes.normalizeItem('billing:update'), 'billing:write');
  assert.equal(Scopes.levelOf(['a:read', 'b:write'], 'b'), 'write');
  assert.equal(Scopes.levelOf(['a:read'], 'z'), undefined);
});

test('scopes: a sparse array\'s hole is refused, not kept or skipped', () => {
  // eslint-disable-next-line no-sparse-arrays
  assert.throws(() => Scopes.normalize([, 'billing:read']), /^ValidationError: scopes\[0\] must be a valid scope grant/);
});

test('levelOf: an entry without a level never matches', () => {
  assert.equal(Scopes.levelOf(['billing'], 'billin'), undefined);
  assert.equal(Scopes.levelOf([':write'], ''), undefined);
});

test('scopes: names are case-insensitive, so reserved names stay reserved', () => {
  accepts(Scopes, [[['Billing:write', 'billing:read'], ['billing:write']]]);
  refuses(Scopes, [['Read:write'], ['DELETE:read']]);
});

test('levelOf reads each grant as scopes() does', () => {
  assert.equal(Scopes.levelOf(['billing:read', 'billing:write'], 'billing'), 'write');
  assert.equal(Scopes.levelOf(['Billing:update', 'junk'], 'billing'), 'write');
  assert.equal(Scopes.levelOf('billing:write', 'billing'), undefined);
});

test('scopes: list input is capped before it is split', () => {
  refuses(Scopes, ['a:read,'.repeat(50000), Object.fromEntries(Array.from({ length: 257 }, (_, i) => [`s${i}`, 'read']))]);
});

test('scopes: scope names and levels case-map as ASCII only', () => {
  refuses(Scopes, [['billing:\u212aread'], ['\u212abilling:read']]);
  assert.equal(Scopes.levelOf(['kiosk:read'], '\u212aiosk'), undefined);
});
