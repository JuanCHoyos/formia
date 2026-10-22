import { IdParamsSchema } from '@formly/core/schemas/common';
import { CreateFormSchema, UpdateFormSchema } from '@formly/core/schemas/form';
import { Elysia } from 'elysia';

import {
  createForm,
  discardDraft,
  getFormById,
  getFormDetail,
  getFormsByOwnerId,
  publishForm,
  updateForm,
} from './forms.service';
import { authenticatedWithUser } from '../../middleware/authenticated';
import { fail, ok } from '../../http/responses';

export const formsRouter = new Elysia({ prefix: '/forms' })
  .use(authenticatedWithUser)
  .post(
    '/',
    async ({ body, status, user }) => {
      if (body.id && (await getFormById(body.id))) {
        return status(409, fail('FORM_ALREADY_EXISTS', 'Form already exists'));
      }

      const form = await createForm(user.id, body);
      return status(201, ok('Form created successfully', form));
    },
    { body: CreateFormSchema },
  )
  .get('/', async ({ status, user }) => {
    const forms = await getFormsByOwnerId(user.id);
    return status(200, ok('Forms retrieved successfully', forms));
  })
  .get(
    '/:id',
    async ({ params, status, user }) => {
      const form = await getFormById(params.id);
      if (!form || form.ownerId !== user.id) {
        return status(404, fail('FORM_NOT_FOUND', 'Form not found'));
      }

      return status(200, ok('Form retrieved successfully', await getFormDetail(form)));
    },
    { params: IdParamsSchema },
  )
  .patch(
    '/:id',
    async ({ params, body, status, user }) => {
      const form = await getFormById(params.id);
      if (!form || form.ownerId !== user.id) {
        return status(404, fail('FORM_NOT_FOUND', 'Form not found'));
      }

      return status(200, ok('Form updated successfully', await updateForm(form, body)));
    },
    { params: IdParamsSchema, body: UpdateFormSchema },
  )
  .delete(
    '/:id/draft',
    async ({ params, status, user }) => {
      const form = await getFormById(params.id);
      if (!form || form.ownerId !== user.id) {
        return status(404, fail('FORM_NOT_FOUND', 'Form not found'));
      }

      return status(200, ok('Draft discarded successfully', await discardDraft(form)));
    },
    { params: IdParamsSchema },
  )
  .post(
    '/:id/publish',
    async ({ params, status, user }) => {
      const form = await getFormById(params.id);
      if (!form || form.ownerId !== user.id) {
        return status(404, fail('FORM_NOT_FOUND', 'Form not found'));
      }

      return status(200, ok('Form published successfully', await publishForm(form)));
    },
    { params: IdParamsSchema },
  );
