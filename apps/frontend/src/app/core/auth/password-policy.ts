import { PasswordSchema } from "@formly/core/schemas/auth";

export const isCognitoPasswordValid = (password: string): boolean => {
  return PasswordSchema.safeParse(password).success;
};
