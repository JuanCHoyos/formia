import type { FieldTypeConfig } from '@ngx-formly/core';
import type { OmitBaseConfig } from './base-field';
import z from 'zod';

export const ParagraphFieldTypeSchema = z.object({
  id: z.string(),
  type: z.literal('paragraph'),
  props: z.object({
    text: z.string(),
  }),
});

export type ParagraphFieldTypeSchemaType = z.infer<typeof ParagraphFieldTypeSchema>;
export type ParagraphFieldProps = ParagraphFieldTypeSchemaType['props'];

export type ParagraphFieldTypeConfig = Omit<FieldTypeConfig<ParagraphFieldProps>, OmitBaseConfig> &
  ParagraphFieldTypeSchemaType;
