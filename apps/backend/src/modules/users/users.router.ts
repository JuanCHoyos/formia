import { Elysia } from "elysia";

import { createUser, toUserProfile } from "./users.service";
import { CreateUserProfileSchema } from "@formly/core/schemas";
import { authenticatedWithUser, authenticatedWithCognito } from "../../middleware/authenticated";



export const usersRouter = new Elysia({ prefix: "/users" })
  .use(
    new Elysia()
      .use(authenticatedWithUser)
      .get('/me', ({ user }) => ({
        success: true,
        message: 'user retrieved successfully',
        data: toUserProfile(user),
      })),
  )
  .use(
    new Elysia()
      .use(authenticatedWithCognito)
      .post("/", async ({ body, cognito, status }) => {
        const user = await createUser({
          cognitoSub: cognito.sub,
          fullName: cognito.name,
          email: cognito.email,
          roles: body.roles,
          termsAccepted: body.termsAccepted,
          authProvider: cognito.provider ?? "SYSTEM",
          termsAcceptedAt: new Date()
        });
        return status(201, {
          success: true,
          message: 'User created successfully',
          data: toUserProfile(user)
        });
      }, {
        body: CreateUserProfileSchema
      }))


