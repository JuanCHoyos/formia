import { isDeepStrictEqual } from "node:util";

import { FormModel, type Form } from "@formly/core/data/models/form";
import {
  FormVersionModel,
  replaceValue,
  type FormVersion,
} from "@formly/core/data/models/form-version";
import {
  MAX_PREVIOUS_FORM_VERSIONS,
  type CreateFormInput,
  type UpdateFormInput,
} from "@formly/core/schemas/form";

/** Newest versions of a form first; the draft, when present, is always the newest. */
const VERSIONS_PAGE_SIZE = MAX_PREVIOUS_FORM_VERSIONS + 2;

export async function createForm(ownerId: string, input: CreateFormInput) {
  const { id, title, isPublic, allowMultipleSubmissions, maxSubmissionsPerUser, schema } =
    input;
  const createdAt = Date.now();

  const form = await FormModel.put({
    ...(id ? { id } : {}),
    ownerId,
    createdAt,
    _action: "CREATE",
    _createdAt: new Date(),
  });

  try {
    await FormVersionModel.put({
      formId: form.id,
      version: 1,
      status: "draft",
      title,
      isPublic,
      allowMultipleSubmissions,
      maxSubmissionsPerUser,
      schema,
      createdAt,
      _action: "CREATE",
      _createdAt: new Date(),
    });
  } catch (error) {
    await FormModel.delete({ id: form.id });
    throw error;
  }

  return getFormDetail(form);
}

export function getFormById(id: string) {
  return FormModel.get({ id });
}

function getRecentVersions(formId: string) {
  return FormVersionModel.query(
    { index: "byForm", partition: formId },
    { reverse: true, limit: VERSIONS_PAGE_SIZE },
  );
}

/** Forms of an owner, each with the metadata of the version the creator is working on. */
export async function getFormsByOwnerId(ownerId: string) {
  const forms = await FormModel.query({ index: "byOwner", partition: ownerId });

  const summaries = await Promise.all(
    forms.map(async (form) => {
      const [latest] = await FormVersionModel.query(
        { index: "byForm", partition: form.id },
        { reverse: true, limit: 1 },
      );

      return latest
        ? {
            ...form,
            title: latest.title,
            isPublic: latest.isPublic,
            status: latest.status,
            version: latest.version,
          }
        : null;
    }),
  );

  return summaries.filter((summary) => summary !== null);
}

/** Creator's view: the editable draft, the published version and the published history. */
export async function getFormDetail(form: Form) {
  const versions = await getRecentVersions(form.id);

  return {
    ...form,
    draft: versions.find(({ status }) => status === "draft") ?? null,
    published: versions.find(({ id }) => id === form.publishedVersionId) ?? null,
    versions: versions
      .filter(({ status }) => status === "published")
      .sort((a, b) => a.version - b.version)
      .slice(-(MAX_PREVIOUS_FORM_VERSIONS + 1)),
  };
}

/** Public access: always the published version, never the draft. */
export async function getPublishedVersionByFormId(formId: string) {
  const form = await getFormById(formId);

  return form?.publishedVersionId
    ? FormVersionModel.get({ id: form.publishedVersionId })
    : undefined;
}

/** Returns the form's draft, creating it as an independent copy of the latest version if missing. */
async function getOrCreateDraft(form: Form): Promise<FormVersion> {
  const versions = await getRecentVersions(form.id);
  const existing = versions.find(({ status }) => status === "draft");
  if (existing) {
    return existing;
  }

  const base = versions.find(({ id }) => id === form.publishedVersionId) ?? versions[0];
  if (!base) {
    throw new Error("The form has no version to create a draft from.");
  }

  return FormVersionModel.put({
    formId: form.id,
    version: base.version + 1,
    status: "draft",
    title: base.title,
    isPublic: base.isPublic,
    allowMultipleSubmissions: base.allowMultipleSubmissions,
    maxSubmissionsPerUser: base.maxSubmissionsPerUser,
    schema: structuredClone(base.schema),
    createdAt: Date.now(),
    _action: "CREATE",
    _createdAt: new Date(),
  });
}

type FormDetail = Awaited<ReturnType<typeof getFormDetail>>;

const CONTENT_KEYS = [
  "title",
  "isPublic",
  "allowMultipleSubmissions",
  "maxSubmissionsPerUser",
  "schema",
] as const;

const hasSameContent = (a: FormVersion, b: FormVersion) =>
  CONTENT_KEYS.every((key) => isDeepStrictEqual(a[key], b[key]));

/** Deletes the draft; the form keeps its published version untouched. */
async function dropDraft(detail: FormDetail): Promise<FormDetail> {
  if (!detail.draft) {
    return detail;
  }

  await FormVersionModel.delete(
    { id: detail.draft.id },
    { condition: { attr: "status", eq: "draft" } },
  );
  return { ...detail, draft: null };
}

/** Throws away the unpublished changes. A form that was never published keeps its only draft. */
export async function discardDraft(form: Form) {
  const detail = await getFormDetail(form);
  return detail.published ? dropDraft(detail) : detail;
}

export async function updateForm(form: Form, input: UpdateFormInput) {
  const draft = await getOrCreateDraft(form);

  const { schema, ...fields } = input;

  await FormVersionModel.update(
    {
      ...fields,
      ...(schema ? { schema: replaceValue(schema) } : {}),
      id: draft.id,
      _action: "UPDATE",
      _updatedAt: new Date(),
    },
    { condition: { attr: "status", eq: "draft" } },
  );

  // A draft that went back to the published content is not a change: drop it.
  const detail = await getFormDetail(form);
  return detail.draft && detail.published && hasSameContent(detail.draft, detail.published)
    ? dropDraft(detail)
    : detail;
}

/** Publishes the draft: it becomes immutable and the form points to it. */
export async function publishForm(form: Form) {
  const draft = (await getRecentVersions(form.id)).find(
    ({ status }) => status === "draft",
  );
  if (!draft) {
    return getFormDetail(form);
  }

  await FormVersionModel.update(
    {
      id: draft.id,
      status: "published",
      publishedAt: Date.now(),
      _action: "UPDATE",
      _updatedAt: new Date(),
    },
    { condition: { attr: "status", eq: "draft" } },
  );

  await FormModel.update({
    id: form.id,
    publishedVersionId: draft.id,
    _action: "UPDATE",
    _updatedAt: new Date(),
  });

  return getFormDetail({ ...form, publishedVersionId: draft.id });
}
