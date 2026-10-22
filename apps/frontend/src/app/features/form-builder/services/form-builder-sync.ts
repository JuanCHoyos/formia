import { DestroyRef, effect, inject, Service, signal, type OnDestroy } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { apiClient } from '@/app/core/api/api-client';
import { apiResult } from '@/app/core/api/api-result';
import { Notifications } from '@/app/ui/services/notifications';

import {
  FormFieldConfigurationSchema,
  type FormFieldConfiguration,
} from '../formly/interfaces/app-formly-field-config';
import { FormBuilderStore, type FormSettings } from './form-builder-store';

/** Quiet time after the last change before the draft is sent. */
const AUTOSAVE_DEBOUNCE_MS = 2000;
/** Upper bound while the user keeps editing, so a long session never goes unsaved. */
const AUTOSAVE_MAX_WAIT_MS = 15000;
const AUTOSAVE_MAX_RETRIES = 3;
const AUTOSAVE_RETRY_BASE_MS = 5000;
const MIN_TITLE_LENGTH = 3;

export interface PublishedVersion {
  version: number;
  publishedAt: number;
  fields: FormFieldConfiguration;
}

interface PersistedDraft {
  title: string;
  fields: string;
  settings: string;
}

interface DraftPatch extends Partial<FormSettings> {
  title?: string;
  schema?: { fields: FormFieldConfiguration };
}

export type SaveState = 'error' | 'idle' | 'saved' | 'saving';

/**
 * Keeps the builder store in sync with the API: loads (or creates) the form, autosaves the
 * work in progress as `draft` and copies it to `definition` when the form is published.
 */
@Service({ autoProvided: false })
export class FormBuilderSync implements OnDestroy {
  private readonly store = inject(FormBuilderStore);
  private readonly notifications = inject(Notifications);
  private readonly translate = inject(TranslateService);

  private formId: string | null = null;
  /** Serialized parts of the editor state that are already stored in the API. */
  private persisted: PersistedDraft | null = null;
  /** Saves run one at a time; a queued save recomputes what changed when it starts. */
  private queue: Promise<unknown> = Promise.resolve();
  private dirtySince: number | null = null;
  private retries = 0;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;

  readonly saveState = signal<SaveState>('idle');
  readonly publishing = signal(false);
  /** Whether the API holds unpublished changes (a draft) for this form. */
  readonly hasDraft = signal(false);
  readonly publishedVersion = signal(0);
  /** Last published versions stored by the API (it keeps only the most recent ones). */
  readonly publishedVersions = signal<PublishedVersion[]>([]);

  constructor() {
    effect((onCleanup) => {
      // Reading the signals is what re-runs the effect on every edit.
      this.store.title();
      this.store.fields();
      this.store.settings();

      if (this.formId === null || this.pendingChanges() === null) {
        this.dirtySince = null;
        return;
      }

      this.dirtySince ??= Date.now();
      const waited = Date.now() - this.dirtySince;
      const delay = Math.max(0, Math.min(AUTOSAVE_DEBOUNCE_MS, AUTOSAVE_MAX_WAIT_MS - waited));
      const timer = setTimeout(() => void this.saveDraft(), delay);
      onCleanup(() => clearTimeout(timer));
    });

    // Refreshing or closing the tab never prompts: pending edits are flushed instead. `keepalive`
    // lets the request finish after the page is gone.
    const flushOnHide = () => {
      if (document.visibilityState === 'hidden') {
        void this.saveDraft({ keepalive: true });
      }
    };

    document.addEventListener('visibilitychange', flushOnHide);
    window.addEventListener('pagehide', flushOnHide);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', flushOnHide);
      window.removeEventListener('pagehide', flushOnHide);
    });
  }

  /** Leaving the builder sends whatever the debounce had not sent yet. */
  ngOnDestroy(): void {
    clearTimeout(this.retryTimer);
    void this.saveDraft();
  }

  /** Loads the form into the store, creating it with this id when it doesn't exist yet. */
  async load(id: string): Promise<void> {
    this.formId = null;
    this.saveState.set('idle');

    const existing = await apiResult(apiClient.forms({ id }).get());
    let form;

    if (existing.isSuccess()) {
      form = existing.data;
    } else if (existing.error.code === 'FORM_NOT_FOUND') {
      const created = await apiResult(
        apiClient.forms.post({
          id,
          title: this.defaultTitle(),
          isPublic: false,
          allowMultipleSubmissions: false,
          maxSubmissionsPerUser: 1,
          schema: {},
        }),
      );

      if (created.isError()) {
        throw new Error(created.error.message);
      }
      form = created.data;
    } else {
      throw new Error(existing.error.message);
    }

    const stored = FormFieldConfigurationSchema.safeParse(
      (form.draft ?? form.published)?.schema['fields'],
    );
    const fields = stored.success ? stored.data : undefined;

    const current = form.draft ?? form.published;

    this.store.load(
      current?.title ?? this.defaultTitle(),
      fields,
      current
        ? {
            isPublic: current.isPublic,
            allowMultipleSubmissions: current.allowMultipleSubmissions,
            maxSubmissionsPerUser: current.maxSubmissionsPerUser,
          }
        : undefined,
    );
    this.hasDraft.set(form.draft !== null);
    this.publishedVersion.set(form.published?.version ?? 0);
    this.publishedVersions.set(this.toPublishedVersions(form.versions));
    this.persisted = {
      title: this.store.title().trim(),
      fields: JSON.stringify(this.store.fields()),
      settings: JSON.stringify(this.normalizeSettings(this.store.settings())),
    };
    this.dirtySince = null;
    this.retries = 0;
    this.formId = id;
  }

  /**
   * Whether the user can leave the builder. While a save is in flight it stays and says why;
   * otherwise pending edits are saved first, and only a failed save asks for confirmation.
   */
  async canLeave(): Promise<boolean> {
    if (this.formId === null || this.pendingChanges() === null) {
      return true;
    }
    if (this.saveState() === 'saving') {
      this.notifications.info(
        'formBuilder.leaveBlocked.title',
        'formBuilder.leaveBlocked.message',
        {
          life: 4_000,
        },
      );
      return false;
    }
    if (await this.saveDraft()) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      this.notifications.confirmDestructive({
        titleKey: 'formBuilder.confirmations.leaveUnsaved.title',
        messageKey: 'formBuilder.confirmations.leaveUnsaved.message',
        acceptLabelKey: 'formBuilder.confirmations.leaveUnsaved.leave',
        cancelLabelKey: 'formBuilder.confirmations.leaveUnsaved.stay',
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }

  /** Saves what changed since the last successful save; concurrent calls are coalesced. */
  saveDraft({ keepalive = false } = {}): Promise<boolean> {
    const run = this.queue.then(() => this.persistChanges(keepalive));
    this.queue = run.catch(() => false);
    return run;
  }

  private async persistChanges(keepalive: boolean): Promise<boolean> {
    const formId = this.formId;
    const changes = this.pendingChanges();

    if (formId === null) {
      return false;
    }
    if (changes === null) {
      return true;
    }

    this.saveState.set('saving');
    try {
      const result = await apiResult(
        apiClient.forms({ id: formId }).patch(changes.body, {
          fetch: { keepalive },
        }),
      );

      if (result.isError()) {
        throw new Error(result.error.message);
      }

      if (this.persisted !== null) {
        this.persisted = { ...this.persisted, ...changes.snapshot };
      }
      this.hasDraft.set(result.data.draft != null);
      this.dirtySince = null;
      this.retries = 0;
      // Edits made while the request was in flight are still pending.
      this.saveState.set(this.pendingChanges() === null ? 'saved' : 'saving');
      return true;
    } catch {
      this.saveState.set('error');
      this.scheduleRetry();
      return false;
    }
  }

  private scheduleRetry(): void {
    if (this.retries >= AUTOSAVE_MAX_RETRIES) {
      return;
    }

    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(
      () => void this.saveDraft(),
      AUTOSAVE_RETRY_BASE_MS * 2 ** this.retries,
    );
    this.retries += 1;
  }

  /** Compares the editor with what the API already has; `null` means there is nothing to send. */
  private pendingChanges(): { body: DraftPatch; snapshot: Partial<PersistedDraft> } | null {
    if (this.persisted === null) {
      return null;
    }

    const title = this.store.title().trim();
    const fields = JSON.stringify(this.store.fields());
    const settings = this.normalizeSettings(this.store.settings());
    const serializedSettings = JSON.stringify(settings);

    const body: DraftPatch = {};
    const snapshot: Partial<PersistedDraft> = {};

    // A title that is too short is kept in the editor but never sent.
    if (title.length >= MIN_TITLE_LENGTH && title !== this.persisted.title) {
      body.title = title;
      snapshot.title = title;
    }
    if (fields !== this.persisted.fields) {
      body.schema = { fields: this.store.fields() };
      snapshot.fields = fields;
    }
    if (serializedSettings !== this.persisted.settings) {
      // The API requires the three settings to be updated together.
      Object.assign(body, settings);
      snapshot.settings = serializedSettings;
    }

    return Object.keys(body).length > 0 ? { body, snapshot } : null;
  }

  async publish(): Promise<void> {
    if (this.formId === null || this.publishing()) {
      return;
    }

    this.publishing.set(true);
    try {
      if (!(await this.saveDraft())) {
        throw new Error('The draft could not be saved.');
      }

      const result = await apiResult(apiClient.forms({ id: this.formId }).publish.post());

      if (result.isError()) {
        throw new Error(result.error.message);
      }

      this.hasDraft.set(false);
      this.publishedVersion.set(result.data.published?.version ?? this.publishedVersion());
      this.publishedVersions.set(this.toPublishedVersions(result.data.versions));
      this.notifications.success('formBuilder.publish.successTitle', 'formBuilder.publish.success');
    } catch {
      this.notifications.error('formBuilder.publish.errorTitle', 'formBuilder.publish.error');
    } finally {
      this.publishing.set(false);
    }
  }

  /** Asks for confirmation, then drops the unpublished changes and reloads the published version. */
  discardDraft(): void {
    this.notifications.confirmDestructive({
      titleKey: 'formBuilder.confirmations.discardDraft.title',
      messageKey: 'formBuilder.confirmations.discardDraft.message',
      acceptLabelKey: 'formBuilder.confirmations.discardDraft.discard',
      accept: () => void this.dropDraft(),
    });
  }

  private async dropDraft(): Promise<void> {
    const formId = this.formId;
    if (formId === null) {
      return;
    }

    try {
      // Let an in-flight autosave finish so it cannot recreate the draft afterwards.
      await this.queue;
      const result = await apiResult(apiClient.forms({ id: formId }).draft.delete());

      if (result.isError()) {
        throw new Error(result.error.message);
      }
      await this.load(formId);
    } catch {
      this.notifications.error(
        'formBuilder.confirmations.discardDraft.errorTitle',
        'formBuilder.confirmations.discardDraft.error',
      );
    }
  }

  /** Loads a published version into the editor; it becomes the draft until published again. */
  restoreVersion(version: PublishedVersion): void {
    this.store.formTreeHistory.update(() => structuredClone(version.fields));
    this.store.selectedField.set(null);
    this.store.currentFormPage.set(0);
  }

  private toPublishedVersions(
    versions:
      { version: number; publishedAt?: number; schema: Record<string, unknown> }[] | undefined,
  ): PublishedVersion[] {
    return (versions ?? []).flatMap(({ version, publishedAt, schema }) => {
      const fields = FormFieldConfigurationSchema.safeParse(schema['fields']);
      return fields.success && publishedAt !== undefined
        ? [{ version, publishedAt, fields: fields.data }]
        : [];
    });
  }

  private defaultTitle(): string {
    return this.translate.instant('formBuilder.defaults.formTitle') as string;
  }

  /** The API requires a maximum above 1 for multiple submissions and exactly 1 otherwise. */
  private normalizeSettings(settings: FormSettings): FormSettings {
    return {
      ...settings,
      maxSubmissionsPerUser: settings.allowMultipleSubmissions
        ? Math.max(2, settings.maxSubmissionsPerUser)
        : 1,
    };
  }
}
