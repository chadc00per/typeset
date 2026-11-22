// A real Standard Schema consumer: tRPC takes any Standard Schema as a procedure's input
// parser, so a typeset type or struct() validates (and normalizes) a call's input there.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initTRPC, TRPCError } from '@trpc/server';
import { Email, PostalCode, struct } from '../src/index.js';

const t = initTRPC.create();
const Signup = struct({ email: Email, zip: PostalCode, country: 'country' }, { optional: ['country'] });
const router = t.router({
  subscribe: t.procedure.input(Email).mutation(({ input }) => ({ subscribed: input })),
  signup: t.procedure.input(Signup).mutation(({ input }) => input)
});
const caller = t.createCallerFactory(router)({});

test('tRPC: a type as an input parser hands the procedure its canonical value', async () => {
  assert.deepEqual(await caller.subscribe(' Ada@Example.COM '), { subscribed: 'ada@example.com' });
});

test('tRPC: a refused input is a BAD_REQUEST carrying the issue', async () => {
  await assert.rejects(caller.subscribe('nope'), err => {
    assert(err instanceof TRPCError);
    assert.equal(err.code, 'BAD_REQUEST');
    assert.deepEqual(err.cause.issues, [{ message: 'must be a valid email address' }]);
    return true;
  });
});

test('tRPC: a struct() as an input parser normalizes every field, and reports every issue with its path', async () => {
  assert.deepEqual(await caller.signup({ email: ' A@B.co ', zip: 'sw1a 1aa' }), { email: 'a@b.co', zip: 'SW1A1AA' });
  await assert.rejects(caller.signup({ email: 'x', zip: '!', extra: 1 }), err => {
    assert.equal(err.code, 'BAD_REQUEST');
    assert.deepEqual(err.cause.issues.map(i => i.path.join('.')), ['email', 'zip', 'extra']);
    return true;
  });
});
