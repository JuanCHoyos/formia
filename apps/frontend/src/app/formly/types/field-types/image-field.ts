import type { FieldTypeConfig } from '@ngx-formly/core';

import z from 'zod';

import type { OmitBaseConfig } from './base-field';

export const ImageFieldTypeSchema = z.object({
  id: z.string(),
  type: z.literal('image'),
  props: z.object({
    src: z.string(),
    alt: z.string(),
  }),
});

export type ImageFieldTypeSchemaType = z.infer<typeof ImageFieldTypeSchema>;
export type ImageFieldProps = ImageFieldTypeSchemaType['props'];

export type ImageFieldTypeConfig = Omit<FieldTypeConfig<ImageFieldProps>, OmitBaseConfig> &
  ImageFieldTypeSchemaType;
