import { replaceValue, UserModel, type User } from '@formly/core/data/models/user';
import type {
  CreateUserInput,
  UpdateUserProfileInput,
  UserProfile,
} from '@formly/core/schemas/user';

type ProfileSource = Pick<User, 'authProvider' | 'email' | 'fullName' | 'roles'>;

/** Exposes only the fields the client needs; never return the raw user record. */
export const toUserProfile = (user: ProfileSource): UserProfile => ({
  fullName: user.fullName,
  email: user.email,
  roles: user.roles,
  authProvider: user.authProvider ?? 'SYSTEM',
});

export const canEditFullName = (user: ProfileSource) =>
  (user.authProvider ?? 'SYSTEM') === 'SYSTEM';

export const createUser = (input: CreateUserInput) =>
  UserModel.put({
    fullName: input.fullName,
    email: input.email,
    roles: input.roles,
    cognitoSub: input.cognitoSub,
    termsAccepted: input.termsAccepted,
    termsAcceptedAt: new Date(),
    authProvider: input.authProvider,
    _action: 'CREATE',
    _createdAt: new Date(),
  });

export const updateUserProfile = async (user: User, input: UpdateUserProfileInput) => {
  await UserModel.update({
    id: user.id,
    ...(input.fullName === undefined ? {} : { fullName: input.fullName }),
    ...(input.roles === undefined ? {} : { roles: replaceValue(input.roles) }),
    _action: 'UPDATE',
    _updatedAt: new Date(),
  });

  return toUserProfile({ ...user, ...input });
};

export const getUserById = (id: string) => UserModel.get({ id });

export const getUsersByEmail = (email: string) =>
  UserModel.query({ index: 'byEmail', partition: email });

export const getUserByCognitoSub = async (cognitoSub: string) => {
  const users = await UserModel.query({
    index: 'byCognitoSub',
    partition: cognitoSub,
  });
  return users[0];
};
