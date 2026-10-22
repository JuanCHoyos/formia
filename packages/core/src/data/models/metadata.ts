import { s } from 'dynamodb-toolbox/schema';
import { ulid } from 'ulid';

export const dateSchema = s
  .any()
  .castAs<Date>()
  .transform({
    encode: (value) => value.toISOString(),
    decode: (value?: string) => (value ? new Date(value) : undefined),
  });

export const metadataSchema = s.item({
  id: s
    .string()
    .key()
    .default(() => ulid()),
  _version: s.number().default(1),
  _active: s.boolean().default(true),
  _action: s.string().enum('CREATE', 'UPDATE', 'DELETE', 'RESTORE'),
  _createdAt: dateSchema.required(),
  _updatedAt: dateSchema.optional().default(() => new Date()),
});
