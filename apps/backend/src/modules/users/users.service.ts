import { UserModel } from "@formly/core/data/models/user";
import type { CreateUserInput, UserProfile } from "@formly/core/schemas/user";

/** Exposes only the fields the client needs; never return the raw user record. */
export const toUserProfile = (user: UserProfile): UserProfile => ({
  fullName: user.fullName,
  email: user.email,
  roles: user.roles,
});

export const createUser = (input: CreateUserInput) =>
  UserModel.put({
    fullName: input.fullName,
    email: input.email,
    roles: input.roles,
    cognitoSub: input.cognitoSub,
    termsAccepted: input.termsAccepted,
    termsAcceptedAt: new Date(),
    authProvider: input.authProvider,
    _action: "CREATE",
    _createdAt: new Date(),
  });

export const getUserById = (id: string) => UserModel.get({ id });

export const getUsersByEmail = (email: string) =>
  UserModel.query({ index: "byEmail", partition: email });

export const getUserByCognitoSub = async (cognitoSub: string) => {
  const users = await UserModel.query({
    index: "byCognitoSub",
    partition: cognitoSub,
  });
  return users[0];
};
