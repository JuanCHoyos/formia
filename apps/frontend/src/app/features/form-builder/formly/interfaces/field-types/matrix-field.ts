import type { FieldTypeConfig } from '@ngx-formly/core';
import type { BaseField, OmitBaseConfig } from './base-field';
import { BaseFieldPropsSchema } from './base-field';
import { SelectOptionSchema } from './field-options';
import z from 'zod';

export const MatrixOptionSchema = SelectOptionSchema;

export const MatrixFieldTypeSchema = z.object({
  id: z.string(),
  key: z.string(),
  wrappers: z.tuple([z.literal('form-field')]),
  type: z.literal('matrix'),
  props: BaseFieldPropsSchema.extend({
    questions: z.array(MatrixOptionSchema),
    answers: z.array(MatrixOptionSchema),
    selectionMode: z.enum(['single', 'multiple']),
  }),
});

export type MatrixOption = z.infer<typeof MatrixOptionSchema>;
export type MatrixFieldTypeSchemaType = z.infer<typeof MatrixFieldTypeSchema>;
export type MatrixFieldProps = MatrixFieldTypeSchemaType['props'];

export type MatrixFieldTypeConfig = Omit<FieldTypeConfig<MatrixFieldProps>, OmitBaseConfig> &
  BaseField &
  MatrixFieldTypeSchemaType;
