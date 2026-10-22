import { Elysia } from 'elysia';

import { CreateUserProfileSchema, UpdateUserProfileSchema } from '@formly/core/schemas';

import { fail, ok } from '../../http/responses';
import { authenticatedWithUser, authenticatedWithCognito } from '../../middleware/authenticated';
import { canEditFullName, createUser, toUserProfile, updateUserProfile } from './users.service';

export const usersRouter = new Elysia({ prefix: '/users' })
  .use(
    new Elysia()
      .use(authenticatedWithUser)
      .get('/me', ({ user }) => ok('User retrieved successfully', toUserProfile(user)))
      .patch(
        '/me',
        async ({ body, status, user }) => {
          if (body.fullName !== undefined && !canEditFullName(user)) {
            return status(
              422,
              fail('VALIDATION_ERROR', 'The name is managed by the identity provider'),
            );
          }

          return status(200, ok('User updated successfully', await updateUserProfile(user, body)));
        },
        { body: UpdateUserProfileSchema },
      ),
  )
  .use(
    new Elysia().use(authenticatedWithCognito).post(
      '/',
      async ({ body, cognito, status }) => {
        const user = await createUser({
          cognitoSub: cognito.sub,
          fullName: cognito.name,
          email: cognito.email,
          roles: body.roles,
          termsAccepted: body.termsAccepted,
          authProvider: cognito.provider ?? 'SYSTEM',
          termsAcceptedAt: new Date(),
        });
        return status(201, ok('User created successfully', toUserProfile(user)));
      },
      {
        body: CreateUserProfileSchema,
      },
    ),
  );
