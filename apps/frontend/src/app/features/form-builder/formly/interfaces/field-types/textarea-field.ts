import type { FieldTypeConfig } from '@ngx-formly/core';
import type { BaseField, OmitBaseConfig } from './base-field';
import { BaseFieldPropsSchema } from './base-field';
import z from 'zod';

export const TextareaFieldTypeSchema = z.object({
  id: z.string(),
  key: z.string(),
  wrappers: z.tuple([z.literal('form-field')]),
  type: z.literal('textarea'),
  props: BaseFieldPropsSchema.extend({
    placeholder: z.string(),
    autoResize: z.boolean(),
    max: z.number().min(0).max(1000),
    min: z.number().min(0).max(1000),
  }).refine(({ min, max }) => min <= max, {
    message: 'Min must be less than or equal to max',
    path: ['min'],
  }),
});

export type TextareaFieldTypeSchemaType = z.infer<typeof TextareaFieldTypeSchema>;
export type TextareaFieldProps = TextareaFieldTypeSchemaType['props'];

export type TextareaFieldTypeConfig = Omit<FieldTypeConfig<TextareaFieldProps>, OmitBaseConfig> &
  BaseField &
  TextareaFieldTypeSchemaType;
