// email: Email address, normalized.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Joi from 'joi';
import { Email } from '../../src/index.js';
import { accepts, refuses } from '../helpers.js';

test('email: lowercased and trimmed', () => {
  accepts(Email, [[' Ada@Example.com ', 'ada@example.com'], ['a+tag@sub.example.co.uk', 'a+tag@sub.example.co.uk']]);
  refuses(Email, ['', 'nope', 'a@b', 'ada@localhost', 'ada@example.notatld', 42, null]);
});

test('email accepts exactly what Joi\'s string().email() accepts', () => {
  const joi = Joi.string().email();
  for (const raw of ['a@b.co', 'ada@example.notatld', 'ada@localhost', 'a..b@x.com', 'ada@exa_mple.com', 'ünï@exämple.com',
    'ada+tag@sub.example.co.uk', '"quoted"@example.com', 'ada@[127.0.0.1]', 'ada@example.com.', `${'x'.repeat(65)}@example.com`, 'ada@xn--bcher-kva.de']) {
    const accepted = (() => { try { Email.normalize(raw); return true; } catch { return false; } })();
    assert.equal(accepted, !joi.validate(raw.toLowerCase().trim()).error, raw);
  }
});

test('email: a refusal names the path, like every other type', () => {
  assert.throws(() => Email.normalize('nope', 'user.email'), { message: 'user.email must be a valid email address' });
});

test('email: decomposed and composed spellings store as one NFC address', () => {
  const composed = 'üni@example.com', decomposed = 'üni@example.com';
  assert.notEqual(composed, decomposed);
  assert.equal(Email.normalize(decomposed), composed);
  assert.equal(Email(decomposed), Email(composed));
});

test('email: oversized input is refused before it is read', () => {
  refuses(Email, [' '.repeat(2000) + 'ada@example.com']);
});

test('email: the domain is stored as the URL host parser reads it, so one address has one spelling', () => {
  accepts(Email, [
    ['ada@example\u3002com', 'ada@example.com'], ['ada@exam\u00adple.com', 'ada@example.com'],
    ['ada@\uff45\uff58\uff41\uff4d\uff50\uff4c\uff45.com', 'ada@example.com'], ['a+tag@\u017fub.example.co.uk', 'a+tag@sub.example.co.uk'],
    ['ada@exa\u200bmple.com', 'ada@example.com'], ['ada@xn--mnchen-3ya.de', 'ada@m\u00fcnchen.de'], ['ada@XN--MNCHEN-3YA.de', 'ada@m\u00fcnchen.de'],
    ['ada@m\u00fcnchen.de', 'ada@m\u00fcnchen.de'], ['ada@xn--e1afmkfd.xn--p1ai', 'ada@\u043f\u0440\u0438\u043c\u0435\u0440.\u0440\u0444']
  ]);
});

test('email: invisible characters and lone surrogates are refused in the local part', () => {
  refuses(Email, ['ad\u200ba@example.com', 'ad\u202ea@example.com', 'ad\u00a0a@example.com', 'ad\ufeffa@example.com',
    'ad\u0085a@example.com', 'ad\ue000a@example.com', 'ad\ud800a@example.com', 'ad\udc00a@example.com', 'ada@exam\ud800ple.com']);
  accepts(Email, [['ad\u00e9@example.com', 'ad\u00e9@example.com'], ['\ud83d\ude00@example.com', '\ud83d\ude00@example.com']]);
});
