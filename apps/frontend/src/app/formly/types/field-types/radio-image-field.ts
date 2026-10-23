import type { FieldTypeConfig } from '@ngx-formly/core';

import z from 'zod';

import type { BaseField, OmitBaseConfig } from './base-field';
import { BaseFieldPropsSchema } from './base-field';
import { SelectOptionSchema } from './field-options';

export const RadioImageOptionSchema = SelectOptionSchema.extend({
  image: z.string(),
});

export type RadioImageOption = z.infer<typeof RadioImageOptionSchema>;

export const RadioImageFieldTypeSchema = z.object({
  id: z.string(),
  key: z.string(),
  wrappers: z.tuple([z.literal('form-field')]),
  type: z.literal('radio-image'),
  props: BaseFieldPropsSchema.extend({
    options: z.array(RadioImageOptionSchema),
  }),
});

export type RadioImageFieldTypeSchemaType = z.infer<typeof RadioImageFieldTypeSchema>;
export type RadioImageFieldProps = RadioImageFieldTypeSchemaType['props'];

export type RadioImageFieldTypeConfig = Omit<
  FieldTypeConfig<RadioImageFieldProps>,
  OmitBaseConfig
> &
  BaseField &
  RadioImageFieldTypeSchemaType;
