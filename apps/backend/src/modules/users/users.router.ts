import { Elysia } from 'elysia';

import { CreateUserProfileSchema } from '@formly/core/schemas';

import { ok } from '../../http/responses';
import { authenticatedWithUser, authenticatedWithCognito } from '../../middleware/authenticated';
import { createUser, toUserProfile } from './users.service';

export const usersRouter = new Elysia({ prefix: '/users' })
  .use(
    new Elysia()
      .use(authenticatedWithUser)
      .get('/me', ({ user }) => ok('User retrieved successfully', toUserProfile(user))),
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
