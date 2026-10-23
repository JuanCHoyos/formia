import type { FieldTypeConfig } from '@ngx-formly/core';

import z from 'zod';

import type { OmitBaseConfig } from './base-field';

export const HeadingFieldTypeSchema = z.object({
  id: z.string(),
  type: z.literal('heading'),
  props: z.object({
    text: z.string(),
    level: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
    ]),
    alignment: z.enum(['start', 'center', 'end']),
    subheading: z.string().optional(),
  }),
});

export type HeadingFieldTypeSchemaType = z.infer<typeof HeadingFieldTypeSchema>;
export type HeadingFieldProps = HeadingFieldTypeSchemaType['props'];

export type HeadingFieldTypeConfig = Omit<FieldTypeConfig<HeadingFieldProps>, OmitBaseConfig> &
  HeadingFieldTypeSchemaType;
