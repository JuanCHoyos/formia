import z from 'zod';

export const BaseFieldSchema = z.object({
  id: z.string(),
  key: z.string(),
});

export type BaseField = z.infer<typeof BaseFieldSchema>;

export const BaseFieldPropsSchema = z.object({
  label: z.string(),
  disabled: z.boolean(),
  description: z.string(),
  required: z.boolean(),
});

export type BaseFieldProps = z.infer<typeof BaseFieldPropsSchema>;

export type OmitBaseConfig =
  'type' | 'props' | 'key' | 'wrappers' | 'fieldGroup' | 'fieldArray' | 'id';
