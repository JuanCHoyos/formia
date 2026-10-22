import type { FieldTypeConfig } from '@ngx-formly/core';
import type { BaseField, OmitBaseConfig } from './base-field';
import { BaseFieldPropsSchema } from './base-field';
import z from 'zod';

export const CheckboxFieldTypeSchema = z.object({
  id: z.string(),
  key: z.string(),
  wrappers: z.tuple([z.literal('form-field')]),
  type: z.literal('checkbox'),
  props: BaseFieldPropsSchema,
});

export type CheckboxFieldTypeSchemaType = z.infer<typeof CheckboxFieldTypeSchema>;
export type CheckboxFieldProps = CheckboxFieldTypeSchemaType['props'];
export type CheckboxFieldPropsForm = Required<CheckboxFieldProps>;

export type CheckboxFieldTypeConfig = Omit<FieldTypeConfig<CheckboxFieldProps>, OmitBaseConfig> &
  BaseField &
  CheckboxFieldTypeSchemaType;
