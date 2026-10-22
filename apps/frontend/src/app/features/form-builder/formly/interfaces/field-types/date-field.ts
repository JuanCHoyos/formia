import type { FieldTypeConfig } from '@ngx-formly/core';
import type { BaseField, OmitBaseConfig } from './base-field';
import { BaseFieldPropsSchema } from './base-field';
import { DATE_FORMATS } from '../../constants/date-formats';
import z from 'zod';

export const DateFieldTypeSchema = z.object({
  id: z.string(),
  key: z.string(),
  wrappers: z.tuple([z.literal('form-field')]),
  type: z.literal('date'),
  props: BaseFieldPropsSchema.extend({
    selection: z.enum(['single', 'multiple', 'range']),
    placeholder: z.string().optional(),
    view: z.enum(['date', 'month', 'year']),
    format: z.enum(DATE_FORMATS),
    showButtonBar: z.boolean(),
    showIcon: z.boolean(),
    showTime: z.boolean().optional(),
    hourFormat: z.enum(['12', '24']).optional(),
    timeOnly: z.boolean().optional(),
    minDate: z.date().optional(),
    maxDate: z.date().optional(),
    numberOfMonths: z.number().optional(),
  }),
});

export type DateFieldTypeSchemaType = z.infer<typeof DateFieldTypeSchema>;
export type DateFieldProps = DateFieldTypeSchemaType['props'];
export type DateFormat = DateFieldProps['format'];

export type DateFieldTypeConfig = Omit<FieldTypeConfig<DateFieldProps>, OmitBaseConfig> &
  BaseField &
  DateFieldTypeSchemaType;
