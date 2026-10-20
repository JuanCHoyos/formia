import { z } from "zod";

import { IdSchema } from "./common";

const formRespondentAccessFields = {
  email: z.email(),
};

export const CreateFormRespondentAccessSchema = z
  .object({
    formId: IdSchema,
    ...formRespondentAccessFields,
  })
  .strict();

export const UpdateFormRespondentAccessSchema = z
  .object({
    email: formRespondentAccessFields.email.optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    error: "At least one field must be provided.",
  });

export type CreateFormRespondentAccessInput = z.infer<
  typeof CreateFormRespondentAccessSchema
>;

export type UpdateFormRespondentAccessInput = z.infer<
  typeof UpdateFormRespondentAccessSchema
>;
