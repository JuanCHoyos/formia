import type { FormFieldConfiguration } from '../formly/interfaces/app-formly-field-config';
import type { FormSettings } from './form-settings';

export interface PublishedVersion {
  version: number;
  publishedAt: number;
  fields: FormFieldConfiguration;
}

export interface PersistedDraft {
  title: string;
  fields: string;
  settings: string;
}

export interface DraftPatch extends Partial<FormSettings> {
  title?: string;
  schema?: { fields: FormFieldConfiguration };
}

export type SaveState = 'error' | 'idle' | 'saved' | 'saving';
