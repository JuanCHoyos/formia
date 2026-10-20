import { z } from "zod";

import { AnswerSchema, IdSchema } from "./common";

const formResponseFields = {
  answer: AnswerSchema,
};

export const CreateFormResponseSchema = z
  .object({
    formId: IdSchema,
    formVersionId: IdSchema,
    respondentUserId: IdSchema.optional(),
    ...formResponseFields,
    createdAt: z.number().int().nonnegative().default(() => Date.now()),
  })
  .strict();

export const UpdateFormResponseSchema = z
  .object({
    answer: formResponseFields.answer.optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    error: "At least one field must be provided.",
  });

export type CreateFormResponseInput = z.infer<
  typeof CreateFormResponseSchema
>;
