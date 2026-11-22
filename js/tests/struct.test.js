// struct(): whole objects, every issue collected (cross-language answers: conformance.test.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { struct, Email, PostalCode, ValidationError, toJSONSchema } from '../src/index.js';

const User = struct({ email: Email, zip: PostalCode, country: 'country' }, { optional: ['country'] });

test('struct(): the frozen canonical object, with or without optional fields', () => {
  const value = User({ email: ' A@B.co ', zip: '10001' });
  assert.deepEqual(value, { email: 'a@b.co', zip: '10001' });
  assert(Object.isFrozen(value));
  assert.deepEqual(User.normalize({ email: 'a@b.co', zip: '10001', country: 'us' }), { email: 'a@b.co', zip: '10001', country: 'US' });
  assert.equal(User.is({ email: 'a@b.co', zip: '10001' }), true);
  assert.equal(User.is({ email: 'a@b.co' }), false);
  assert.throws(() => new User({}), TypeError);
});

test('struct(): a refusal carries every issue, its message naming each path', () => {
  assert.throws(() => User.normalize({ email: 'x' }, 'user'), err => {
    assert(err instanceof ValidationError);
    assert.equal(err.message, 'user.email must be a valid email address; user.zip must be a valid postal code');
    assert.equal(err.code, 'invalid');
    assert.deepEqual(err.issues.map(i => i.path), ['user.email', 'user.zip']);
    return true;
  });
});

test('struct(): fields, optional, unknown, and the JSON Schema', () => {
  assert.deepEqual(Object.keys(User.fields), ['email', 'zip', 'country']);
  assert.deepEqual(User.optional, ['country']);
  assert.equal(User.unknown, 'refuse');
  const schema = toJSONSchema(User);
  assert.deepEqual(schema.required, ['email', 'zip']);
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.properties.email, Email.toJSONSchema());
  assert.deepEqual(Email.toJSONSchema(), toJSONSchema('email'));
});

test('struct(): Standard Schema issues carry path segments', () => {
  const Nested = struct({ user: User });
  assert.deepEqual(Nested['~standard'].validate({ user: { email: 'x', zip: '10001' } }), {
    issues: [{ message: 'must be a valid email address', path: ['user', 'email'] }]
  });
  assert.deepEqual(Nested['~standard'].validate({ user: { email: 'a@b.co', zip: '10001' } }), { value: { user: { email: 'a@b.co', zip: '10001' } } });
});

test('struct(): a bad definition is a bug (TypeError)', () => {
  assert.throws(() => struct({ a: 'nope' }), { name: 'TypeError', message: /unknown type "nope"/ });
  assert.throws(() => struct({ a: 'email' }, { optional: ['b'] }), { name: 'TypeError', message: /not a field/ });
  assert.throws(() => struct({ a: 'email' }, { unknown: 'keep' }), { name: 'TypeError', message: /unknown must be/ });
  assert.throws(() => struct({ a: 42 }), TypeError);
});
