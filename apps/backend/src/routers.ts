import { Elysia } from 'elysia';
import { formsRouter } from './modules/forms/forms.router';
import { usersRouter } from './modules/users/users.router';

export const routers = new Elysia().use(usersRouter).use(formsRouter);
