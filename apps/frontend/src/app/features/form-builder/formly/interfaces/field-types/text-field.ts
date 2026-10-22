import type { FieldTypeConfig } from '@ngx-formly/core';
import type { BaseField, OmitBaseConfig } from './base-field';
import { BaseFieldPropsSchema } from './base-field';
import z from 'zod';

export const TextFieldTypeSchema = z.object({
  id: z.string(),
  key: z.string(),
  wrappers: z.tuple([z.literal('form-field')]),
  type: z.literal('text'),
  props: BaseFieldPropsSchema.extend({
    placeholder: z.string(),
    max: z.number().min(0).max(100),
    min: z.number().min(0).max(100),
    pattern: z.string(),
  }).refine(({ min, max }) => min <= max, {
    message: 'Min must be less than or equal to max',
    path: ['min'],
  }),
});

export type TextFieldTypeSchemaType = z.infer<typeof TextFieldTypeSchema>;
export type TextFieldProps = TextFieldTypeSchemaType['props'];

export type TextFieldTypeConfig = Omit<FieldTypeConfig<TextFieldProps>, OmitBaseConfig> &
  BaseField &
  TextFieldTypeSchemaType;
