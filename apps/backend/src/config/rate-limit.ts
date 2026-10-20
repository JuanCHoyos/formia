import { rateLimit } from 'elysia-rate-limit';

export const rateLimiter = rateLimit({
    max: 5,
    duration: 60_000,
    scoping: 'global',
    errorResponse: new Response(
        JSON.stringify({
            success: false,
            message: 'Too many requests. Please try again later.',
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
            },
        },
    ),
});