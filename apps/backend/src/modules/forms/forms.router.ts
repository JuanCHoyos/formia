import { IdParamsSchema } from "@formly/core/schemas/common";
import {
  CreateFormSchema,
  UpdateFormSchema,
} from "@formly/core/schemas/form";
import { Elysia } from "elysia";

import {
  createForm,
  getFormById,
  getFormDetail,
  getFormsByOwnerId,
  publishForm,
  updateForm,
} from "./forms.service";
import { authenticatedWithUser } from "../../middleware/authenticated";


export const formsRouter = new Elysia({ prefix: "/forms" })
  .use(authenticatedWithUser)
  .post(
    "/",
    async ({ body, status, user }) => {
      if (body.id && (await getFormById(body.id))) {
        return status(409, { success: false as const, message: "Form already exists" });
      }

      const form = await createForm(user.id, body);
      return status(201, {
        success: true as const,
        message: "Form created successfully",
        data: form,
      });
    },
    { body: CreateFormSchema },
  )
  .get("/", async ({ status, user }) => {
    const forms = await getFormsByOwnerId(user.id);
    return status(200, {
      success: true,
      message: "Forms retrieved successfully",
      data: forms
    });
  })
  .get(
    "/:id",
    async ({ params, status, user }) => {
      const form = await getFormById(params.id);
      if (!form || form.ownerId !== user.id) {
        return status(404, { success: false as const, message: "Form not found" });
      }

      return status(200, {
        success: true as const,
        message: "Form retrieved successfully",
        data: await getFormDetail(form),
      });
    },
    { params: IdParamsSchema },
  )
  .patch(
    "/:id",
    async ({ params, body, status, user }) => {
      const form = await getFormById(params.id);
      if (!form || form.ownerId !== user.id) {
        return status(404, { success: false as const, message: "Form not found" });
      }

      return status(200, {
        success: true as const,
        message: "Form updated successfully",
        data: await updateForm(form, body),
      });
    },
    { params: IdParamsSchema, body: UpdateFormSchema },
  )
  .post(
    "/:id/publish",
    async ({ params, status, user }) => {
      const form = await getFormById(params.id);
      if (!form || form.ownerId !== user.id) {
        return status(404, { success: false as const, message: "Form not found" });
      }

      return status(200, {
        success: true as const,
        message: "Form published successfully",
        data: await publishForm(form),
      });
    },
    { params: IdParamsSchema },
  );
