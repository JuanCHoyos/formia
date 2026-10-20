import { z } from "zod";

import { IdSchema } from "./common";

const projectAssetFields = {
  key: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
};

export const CreateProjectAssetSchema = z
  .object({
    formId: IdSchema,
    ownerId: IdSchema,
    ...projectAssetFields,
  })
  .strict();

export const UpdateProjectAssetSchema = z
  .object({
    key: projectAssetFields.key.optional(),
    fileName: projectAssetFields.fileName.optional(),
    contentType: projectAssetFields.contentType.optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    error: "At least one field must be provided.",
  });

export type CreateProjectAssetInput = z.infer<
  typeof CreateProjectAssetSchema
>;

export type UpdateProjectAssetInput = z.infer<
  typeof UpdateProjectAssetSchema
>;
  