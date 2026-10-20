import { Elysia } from 'elysia';
import { bearer } from '@elysiajs/bearer';
import { getUsersByEmail } from '../modules/users/users.service';
import { verifyAccessTokenUser, verifyIdTokenUser } from '@formly/core/auth';



const validateBearerToken = async (token: string | null | undefined, idToken: string | null | undefined) => {
    if (!token || !idToken) {
        return {
            success: false,
            message: 'A valid bearer token and ID token are required',
        };
    }

    try {
        await verifyAccessTokenUser(token);
    } catch {
        return {
            success: false,
            message: "Invalid or expired token",
        };
    }

    try {
        const cognitoIdTokenPayload = await verifyIdTokenUser(idToken);
        return {
            success: true,
            data: cognitoIdTokenPayload,
        };
    } catch {
        return {
            success: false,
            message: "Invalid or expired token",
        };
    }


};

export const authenticatedWithUser = new Elysia({ name: 'authenticated-with-user' })
    .use(bearer())
    .derive({ as: 'scoped' }, async ({ bearer: token, headers, status }) => {
        const idToken = headers["x-id-token"];
        const validationResult = await validateBearerToken(token, idToken);

        if (!validationResult.success || !validationResult.data) {
            return status(401, {
                success: false,
                message: validationResult.message,
            });
        }

        const email = validationResult.data.email;

        const [user] = await getUsersByEmail(email);
        if (!user) {
            return status(404, {
                success: false,
                message: "User not found",
            });
        }

        return { user };
    });

export const authenticatedWithCognito = new Elysia({ name: 'authenticated-with-cognito' })
    .use(bearer())
    .derive({ as: 'scoped' }, async ({ bearer: token, headers, status }) => {
        const idToken = headers["x-id-token"];
        const validationResult = await validateBearerToken(token, idToken);

        if (!validationResult.success || !validationResult.data) {
            return status(401, {
                success: false,
                message: validationResult.message,
            });
        }

        const email = validationResult.data.email;
        const [user] = await getUsersByEmail(email);
        if (user) {
            return status(409, {
                success: false,
                message: "User already exist",
            });
        }

        return { cognito: validationResult.data };
    });