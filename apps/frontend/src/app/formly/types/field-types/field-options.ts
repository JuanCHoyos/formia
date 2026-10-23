import z from 'zod';

export const SelectOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const SelectOptionGroupSchema = z.object({
  label: z.string(),
  value: z.string(),
  items: z.array(SelectOptionSchema),
});

export type LabeledStringOption = z.infer<typeof SelectOptionSchema>;
export type SelectOption = z.infer<typeof SelectOptionSchema>;
