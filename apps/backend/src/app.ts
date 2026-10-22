import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { node } from '@elysiajs/node';
import { helmet } from 'elysia-helmet';
import { routers } from './routers';
import { fail } from './http/responses';

export const app = new Elysia({ adapter: node(), prefix: '/api/v1' })
  .use(
    cors({
      origin: 'http://localhost:4200',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-id-token'],
    }),
  )
  .use(helmet())
  .onError(({ code, error, set }) => {
    switch (code) {
      case 'VALIDATION':
      case 'PARSE':
        set.status = error.status;
        return fail('VALIDATION_ERROR', 'The request is invalid');
      case 'NOT_FOUND':
        set.status = 404;
        return fail('NOT_FOUND', 'Route not found');
      case 'INTERNAL_SERVER_ERROR':
      case 'UNKNOWN':
        console.error(error);
        set.status = 500;
        return fail('UNKNOWN_ERROR', 'An unexpected error occurred');
      default:
        return undefined;
    }
  })
  .use(routers);

export type App = typeof app;
