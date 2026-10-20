import type { FieldTypeConfig } from '@ngx-formly/core';
import type { BaseField, OmitBaseConfig } from './base-field';
import { BaseFieldPropsSchema } from './base-field';
import { SelectOptionSchema } from './field-options';
import z from 'zod';

export const RadioOptionSchema = SelectOptionSchema;

export const RadioFieldTypeSchema = z.object({
  id: z.string(),
  key: z.string(),
  wrappers: z.tuple([z.literal('form-field')]),
  type: z.literal('radio'),
  props: BaseFieldPropsSchema.extend({
    options: z.array(RadioOptionSchema),
  }),
});

export type RadioFieldTypeSchemaType = z.infer<typeof RadioFieldTypeSchema>;
export type RadioFieldProps = RadioFieldTypeSchemaType['props'];

export type RadioFieldTypeConfig = Omit<FieldTypeConfig<RadioFieldProps>, OmitBaseConfig> &
  BaseField &
  RadioFieldTypeSchemaType;
