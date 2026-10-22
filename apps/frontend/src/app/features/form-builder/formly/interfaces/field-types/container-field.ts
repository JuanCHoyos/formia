import type { FieldTypeConfig } from '@ngx-formly/core';
import type { AppFormlyFieldConfig } from '../app-formly-field-config';
import type { BaseField, OmitBaseConfig } from './base-field';
import z from 'zod';

export const ContainerFieldTypeSchema = z.object({
  id: z.string(),
  key: z.string(),
  type: z.literal('container-group'),
  props: z.object({
    label: z.string(),
    cols: z.number(),
  }),
  wrappers: z.tuple([z.literal('form-field-container')]),
  fieldGroup: z.array(z.unknown()),
});

export type ContainerFieldTypeSchemaType = z.infer<typeof ContainerFieldTypeSchema>;
export type ContainerFieldProps = ContainerFieldTypeSchemaType['props'];

export type ContainerFieldTypeConfig = Omit<FieldTypeConfig<ContainerFieldProps>, OmitBaseConfig> &
  BaseField &
  Omit<ContainerFieldTypeSchemaType, 'fieldGroup'> & {
    fieldGroup: AppFormlyFieldConfig[];
  };
