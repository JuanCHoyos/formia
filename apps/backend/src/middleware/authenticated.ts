import { Elysia } from 'elysia';
import { bearer } from '@elysiajs/bearer';
import { getUsersByEmail } from '../modules/users/users.service';
import { verifyAccessTokenUser, verifyIdTokenUser } from '@formly/core/auth';
import { fail } from '../http/responses';



const validateBearerToken = async (token: string | null | undefined, idToken: string | null | undefined) => {
    if (!token || !idToken) {
        return {
            success: false as const,
            message: 'A valid bearer token and ID token are required',
        };
    }

    try {
        await verifyAccessTokenUser(token);
    } catch {
        return {
            success: false as const,
            message: "Invalid or expired token",
        };
    }

    try {
        const cognitoIdTokenPayload = await verifyIdTokenUser(idToken);
        return {
            success: true as const,
            data: cognitoIdTokenPayload,
        };
    } catch {
        return {
            success: false as const,
            message: "Invalid or expired token",
        };
    }


};

export const authenticatedWithUser = new Elysia({ name: 'authenticated-with-user' })
    .use(bearer())
    .derive({ as: 'scoped' }, async ({ bearer: token, headers, status }) => {
        const idToken = headers["x-id-token"];
        const validationResult = await validateBearerToken(token, idToken);

        if (!validationResult.success) {
            return status(401, fail('UNAUTHORIZED', validationResult.message));
        }

        const email = validationResult.data.email;

        const [user] = await getUsersByEmail(email);
        if (!user) {
            return status(404, fail('USER_NOT_FOUND', 'User not found'));
        }

        return { user };
    });

export const authenticatedWithCognito = new Elysia({ name: 'authenticated-with-cognito' })
    .use(bearer())
    .derive({ as: 'scoped' }, async ({ bearer: token, headers, status }) => {
        const idToken = headers["x-id-token"];
        const validationResult = await validateBearerToken(token, idToken);

        if (!validationResult.success) {
            return status(401, fail('UNAUTHORIZED', validationResult.message));
        }

        const email = validationResult.data.email;
        const [user] = await getUsersByEmail(email);
        if (user) {
            return status(409, fail('USER_ALREADY_EXISTS', 'User already exists'));
        }

        return { cognito: validationResult.data };
    });