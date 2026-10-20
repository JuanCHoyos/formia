import { z } from "zod";

import { AuthProviderSchema, UserRoleSchema } from "./common";

const userFields = {
  fullName: z.string().trim().min(1),
  email: z.email(),
  roles: z.array(UserRoleSchema).min(1),
};

export const CreateUserSchema = z
  .object({
    fullName: userFields.fullName,
    email: userFields.email,
    termsAccepted: z.boolean().default(true),
    termsAcceptedAt: z.date(),
    cognitoSub: z.string().min(1),
    roles: userFields.roles.default(["FORM_CREATOR"]),
    authProvider: AuthProviderSchema.default("SYSTEM"),
  })
  .strict();

export const CreateUserProfileSchema = CreateUserSchema.pick({
  termsAccepted: true,
  roles: true,
});

export const UserProfileSchema = z.object({
  fullName: userFields.fullName,
  email: userFields.email,
  roles: userFields.roles,
});

export const UpdateUserSchema = z
  .object({
    fullName: userFields.fullName.optional(),
    email: userFields.email.optional(),
    roles: userFields.roles.optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    error: "At least one field must be provided.",
  });

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type CreateUserProfileInput = z.infer<typeof CreateUserProfileSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
