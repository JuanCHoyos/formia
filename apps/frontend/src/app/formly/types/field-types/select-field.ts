import type { FieldTypeConfig } from '@ngx-formly/core';

import z from 'zod';

import type { BaseField, OmitBaseConfig } from './base-field';
import { BaseFieldPropsSchema } from './base-field';
import { SelectOptionSchema } from './field-options';

export const SelectFieldTypeSchema = z.object({
  id: z.string(),
  key: z.string(),
  wrappers: z.tuple([z.literal('form-field')]),
  type: z.literal('select'),
  props: BaseFieldPropsSchema.extend({
    placeholder: z.string(),
    options: z.array(SelectOptionSchema),
    multiple: z.boolean(),
    showClear: z.boolean(),
    filter: z.boolean(),
  }),
});

export type SelectFieldTypeSchemaType = z.infer<typeof SelectFieldTypeSchema>;
export type SelectFieldProps = SelectFieldTypeSchemaType['props'];
export type SelectFieldTypeConfig = Omit<FieldTypeConfig<SelectFieldProps>, OmitBaseConfig> &
  BaseField &
  SelectFieldTypeSchemaType;
