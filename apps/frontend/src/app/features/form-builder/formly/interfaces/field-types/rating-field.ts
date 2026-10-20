import type { FieldTypeConfig } from '@ngx-formly/core';
import type { BaseField, OmitBaseConfig } from './base-field';
import { BaseFieldPropsSchema } from './base-field';
import z from 'zod';

const RatingFieldBasePropsSchema = BaseFieldPropsSchema.extend({
  stars: z.number(),
  lowLabel: z.string().optional(),
  highLabel: z.string().optional(),
});

export const RatingFieldTypeSchema = z.object({
  id: z.string(),
  key: z.string(),
  wrappers: z.tuple([z.literal('form-field')]),
  type: z.literal('rating'),
  props: z.discriminatedUnion('type', [
    RatingFieldBasePropsSchema.extend({
      type: z.literal('star'),
      allowHalf: z.boolean(),
    }),
    RatingFieldBasePropsSchema.extend({
      type: z.literal('number'),
    }),
  ]),
});

export type RatingFieldTypeSchemaType = z.infer<typeof RatingFieldTypeSchema>;
export type RatingFieldProps = RatingFieldTypeSchemaType['props'];

export type RatingFieldTypeConfig = Omit<
  FieldTypeConfig<RatingFieldProps>,
  OmitBaseConfig
> &
  BaseField &
  RatingFieldTypeSchemaType;
