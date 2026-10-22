import type { FieldTypeConfig } from '@ngx-formly/core';
import type { BaseField, OmitBaseConfig } from './base-field';
import { BaseFieldPropsSchema } from './base-field';
import { SelectOptionSchema } from './field-options';
import z from 'zod';

export const MultiCheckboxOptionSchema = SelectOptionSchema;

export const MultiCheckboxFieldTypeSchema = z.object({
  id: z.string(),
  key: z.string(),
  wrappers: z.tuple([z.literal('form-field')]),
  type: z.literal('multicheckbox'),
  props: BaseFieldPropsSchema.extend({
    options: z.array(MultiCheckboxOptionSchema),
  }),
});

export type MultiCheckboxFieldTypeSchemaType = z.infer<typeof MultiCheckboxFieldTypeSchema>;
export type MultiCheckboxFieldProps = MultiCheckboxFieldTypeSchemaType['props'];

export type MultiCheckboxFieldTypeConfig = Omit<
  FieldTypeConfig<MultiCheckboxFieldProps>,
  OmitBaseConfig
> &
  BaseField &
  MultiCheckboxFieldTypeSchemaType;
