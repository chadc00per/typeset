// The struct() cases conformance/struct.json records: each spec is plain JSON (a field is
// a type name, or a nested spec), so every language builds the same struct from it.
import { struct } from '../src/index.js';

// A spec as a struct: { fields: { key: 'typename' | spec }, optional?, unknown? }.
export function fromSpec({ fields, optional, unknown }) {
  return struct(Object.fromEntries(Object.entries(fields).map(([key, f]) => [key, typeof f === 'string' ? f : fromSpec(f)])), { optional, unknown });
}

const address = { fields: { zip: 'postalcode', country: 'country' }, optional: ['country'] };

export const specs = [
  {
    fields: { email: 'email', age: 'integer', tags: 'tagset', address },
    optional: ['age', 'tags'],
    inputs: [
      { email: ' Ada@Example.COM ', address: { zip: 'sw1a 1aa', country: 'gb' } },
      { email: 'ada@example.com', age: '42', tags: ['B', 'a'], address: { zip: '10001' } },
      { email: 'ada@example.com', age: null, tags: null, address: { zip: '10001', country: null } },
      { email: 'nope', age: 'x', tags: ['ok', 7], address: { zip: '!', country: 'zz' } },
      { address: {} },
      {},
      { email: '', address: null },
      { email: 'a@b.co', address: { zip: '10001', extra: 1 }, other: true, ['__proto__']: 1 },
      { email: 'a@b.co', address: 'not an object' },
      'not an object', ['a@b.co'], null, 42
    ]
  },
  {
    fields: { price: 'money', grants: 'scopes' },
    unknown: 'strip',
    inputs: [
      { price: '12.5 usd', grants: ['billing:read', 'billing:write'], note: 'dropped' },
      { price: { amount: 'x', currency: 'usd' }, grants: ['billing:read', 'nope'] },
      { price: { amount: '1', currency: 'xyz' } }
    ]
  },
  {
    fields: {},
    inputs: [{}, { a: 1 }]
  }
];
