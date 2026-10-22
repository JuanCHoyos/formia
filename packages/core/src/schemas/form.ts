import { z } from 'zod';

import { FormContentSchema, IdSchema } from './common';

/** Previous published versions kept in addition to the current one. */
export const MAX_PREVIOUS_FORM_VERSIONS = 5;

export const FormVersionStatusSchema = z.enum(['draft', 'published']);

const formVersionFields = {
  title: z.string().trim().min(3).optional(),
  isPublic: z.boolean().optional(),
  allowMultipleSubmissions: z.boolean().optional(),
  maxSubmissionsPerUser: z.number().int().positive().optional(),
  schema: FormContentSchema.optional(),
};

export const CreateFormSchema = z
  .object({
    id: IdSchema.optional(),
    title: z.string().trim().min(3),
    isPublic: z.boolean().default(false),
    allowMultipleSubmissions: z.boolean().default(false),
    maxSubmissionsPerUser: z.number().int().positive().default(1),
    schema: FormContentSchema,
  })
  .strict()
  .refine(
    ({ allowMultipleSubmissions, maxSubmissionsPerUser }) =>
      allowMultipleSubmissions ? maxSubmissionsPerUser > 1 : maxSubmissionsPerUser === 1,
    {
      path: ['maxSubmissionsPerUser'],
      error:
        'Multiple submissions require a maximum greater than 1; otherwise the maximum must be 1.',
    },
  );

/** Updates the editable draft of a form. */
export const UpdateFormSchema = z
  .object(formVersionFields)
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    error: 'At least one field must be provided.',
  })
  .refine(
    ({ allowMultipleSubmissions, maxSubmissionsPerUser }) => {
      if (allowMultipleSubmissions === undefined || maxSubmissionsPerUser === undefined) {
        return allowMultipleSubmissions === undefined && maxSubmissionsPerUser === undefined;
      }

      return allowMultipleSubmissions ? maxSubmissionsPerUser > 1 : maxSubmissionsPerUser === 1;
    },
    {
      path: ['maxSubmissionsPerUser'],
      error:
        'Update allowMultipleSubmissions and maxSubmissionsPerUser together with consistent values.',
    },
  );

export type CreateFormInput = z.infer<typeof CreateFormSchema>;

export type UpdateFormInput = z.infer<typeof UpdateFormSchema>;
