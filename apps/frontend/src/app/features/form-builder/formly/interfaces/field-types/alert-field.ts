import type { FieldTypeConfig } from '@ngx-formly/core';
import type { OmitBaseConfig } from './base-field';
import z from 'zod';

export const AlertFieldTypeSchema = z.object({
  id: z.string(),
  type: z.literal('alert'),
  props: z.object({
    text: z.string(),
    severity: z.enum(['success', 'info', 'warn', 'error']),
    size: z.enum(['small', 'large']).optional(),
    variant: z.enum(['outlined', 'text', 'simple']),
    closable: z.boolean().optional(),
  }),
});

export type AlertFieldTypeSchemaType = z.infer<typeof AlertFieldTypeSchema>;
export type AlertFieldProps = AlertFieldTypeSchemaType['props'];

export type AlertFieldTypeConfig = Omit<FieldTypeConfig<AlertFieldProps>, OmitBaseConfig> &
  AlertFieldTypeSchemaType;
