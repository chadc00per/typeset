// Compile-only usage check for index.d.ts (npm run typecheck, strict); js/tests/typings.test.js
// keeps its lists in step with the runtime.
import {
  Email, Integer, Money, TagSet, Phone, Geo, get, describe, extend, typeOf, names, toJSONSchema, ValidationError,
  type TypeName, type TypeMetadata, type EmailValue, type PhoneValue, type MoneyValue, type Issue, type StandardSchemaV1
} from '@chadc00per/typeset';

// Constructors return plain branded values: strings, numbers, frozen arrays and objects.
const email: EmailValue = Email('ada@example.com');
const plain: string = email;
const sum: number = Integer('42') + 1;
const stored: EmailValue = Email.normalize('Ada@Example.com');
const money: MoneyValue = Money('12.5 usd');
const amount: string = money.amount;
const tags: readonly string[] = TagSet(['b', 'a']);
const [lng, lat]: readonly [number, number] = Geo([0, 0]);
// @ts-expect-error one type's value is not another's
const mixed: PhoneValue = Email('ada@example.com');
// @ts-expect-error unchecked input is not a checked value
const unchecked: EmailValue = 'ada@example.com';
// @ts-expect-error call a type without new
void new Email('ada@example.com');

// check() narrows; is() narrows the input to what the type accepts.
const result = Phone.check('212-555-0123', 'user.phone');
const value: PhoneValue | string = result.ok ? result.value : result.issues[0].message;
const issue: Issue | undefined = result.ok ? undefined : result.issues[0];
const input: unknown = '42';
if (Integer.is(input)) { const narrowed: string | number = input; void narrowed; }

// The catalog: a known name resolves, any other string may not.
const phone = get('phone');
const meta: TypeMetadata<'phone'> = phone.describe();
const any = get('not-a-type');
// @ts-expect-error an unknown name may be undefined
any.normalize('x');
const name: TypeName = names[0];
const kind = typeOf(tags);
const catalog = extend({ definitions: ['email', 'string'] });
const all: object[] = describe();
const weekday = describe('weekday');
const options: readonly string[] = weekday.ui.control === 'select' ? weekday.ui.options : [];
const schema = toJSONSchema('email');
const title: string = schema.title;

// Standard Schema: any type is a schema validation libraries accept.
const standard: StandardSchemaV1<unknown, EmailValue> = Email;
const err: ValidationError = new ValidationError('x must be a valid x', 'invalid');
void [plain, sum, stored, amount, lng, lat, mixed, unchecked, value, issue, meta, name, kind, catalog, all, options, title, standard, err.code];

// The official Standard Schema interface accepts every type, with its output typed.
import type { StandardSchemaV1 as Spec } from '@standard-schema/spec';
const spec: Spec<unknown, EmailValue> = Email;
const specMoney: Spec<unknown, MoneyValue> = Money;
async function parse<S extends Spec>(schema: S, value: unknown): Promise<Spec.InferOutput<S>> {
  const result = await schema['~standard'].validate(value);
  if (result.issues) throw new Error(result.issues[0].message);
  return result.value;
}
const parsed: Promise<EmailValue> = parse(Email, 'ada@example.com');
void [spec, specMoney, parsed];

// struct(): the value type is inferred from the fields; optional fields are optional.
import { struct, PostalCode, type PostalCodeValue, type Struct, type StructValue } from '@chadc00per/typeset';
const Address = struct({ zip: PostalCode, country: 'country' }, { optional: ['country'] });
const User = struct({ email: Email, phone: 'phone', address: Address }, { optional: ['phone'] });
const user = User({ email: 'a@b.co', address: { zip: '10001' } });
const userEmail: EmailValue = user.email;
const userPhone: PhoneValue | undefined = user.phone;
const userZip: PostalCodeValue = user.address.zip;
const userCountry: string | undefined = user.address.country;
// @ts-expect-error a struct's value is read-only
user.email = Email('b@c.co');
// @ts-expect-error a required field can't be missing from the value type
const noEmail: StructValue<{ email: typeof Email }> = {};
const checked = User.check({});
const allIssues: Issue[] = checked.ok ? [] : checked.issues;
const asSchema: StandardSchemaV1<unknown, StructValue<{ email: typeof Email; phone: typeof Phone; address: typeof Address }, 'phone'>> = User;
const generic: Struct<unknown> = User;
const userSchema = toJSONSchema(User);
const required: string[] = userSchema.required;
const emailSchema = Email.toJSONSchema();
void userEmail; void userPhone; void userZip; void userCountry; void noEmail; void allIssues; void asSchema; void generic; void required; void emailSchema;

// A Standard Schema consumer infers typeset's value types: tRPC's procedure input.
import { initTRPC } from '@trpc/server';
const trpc = initTRPC.create();
trpc.procedure.input(Email).mutation(({ input }) => { const typed: EmailValue = input; return typed; });
trpc.procedure.input(User).mutation(({ input }) => { const typed: EmailValue = input.email; const phone: PhoneValue | undefined = input.phone; return [typed, phone]; });
