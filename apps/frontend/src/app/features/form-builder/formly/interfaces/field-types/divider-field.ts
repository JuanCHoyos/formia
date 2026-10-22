import type { FieldTypeConfig } from '@ngx-formly/core';
import type { OmitBaseConfig } from './base-field';
import z from 'zod';

export const DividerFieldTypeSchema = z.object({
  id: z.string(),
  type: z.literal('divider'),
  props: z.object({
    align: z.enum(['left', 'center', 'right', 'top', 'bottom']),
    layout: z.enum(['horizontal', 'vertical']),
    text: z.string().optional(),
    type: z.enum(['solid', 'dashed', 'dotted']),
  }),
});

export type DividerFieldTypeSchemaType = z.infer<typeof DividerFieldTypeSchema>;
export type DividerFieldProps = DividerFieldTypeSchemaType['props'];

export type DividerFieldTypeConfig = Omit<FieldTypeConfig<DividerFieldProps>, OmitBaseConfig> &
  DividerFieldTypeSchemaType;
