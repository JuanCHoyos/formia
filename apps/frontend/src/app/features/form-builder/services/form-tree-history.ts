import { computed, signal, type Signal, type WritableSignal } from '@angular/core';

import { ulid } from 'ulid';

import type { FormFieldConfiguration } from '../formly/interfaces/app-formly-field-config';

const HISTORY_LIMIT = 50;

export interface FormTreeVersion {
  id: string;
  number: number;
  createdAt: Date;
  snapshot: FormFieldConfiguration;
}

export class FormTreeHistory {
  readonly fields: WritableSignal<FormFieldConfiguration>;
  private readonly _versions: WritableSignal<FormTreeVersion[]>;
  readonly versions: Signal<FormTreeVersion[]>;
  private readonly activeIndex = signal(0);

  readonly currentVersion = computed(() => this.versions()[this.activeIndex()]);
  readonly canUndo = computed(() => this.activeIndex() > 0);
  readonly canRedo = computed(() => this.activeIndex() < this.versions().length - 1);
  readonly hasChanges = computed(() => this.versions().length > 1);

  constructor(fields: WritableSignal<FormFieldConfiguration>) {
    this.fields = fields;
    const initialVersion = this.createVersion(1, fields());
    this._versions = signal([initialVersion]);
    this.versions = this._versions.asReadonly();
  }

  update(updater: (current: FormFieldConfiguration) => FormFieldConfiguration): void {
    const current = this.fields();
    const next = updater(current);

    if (next === current) return;

    const versions = this.versions().slice(0, this.activeIndex() + 1);
    const nextVersionNumber = (versions.at(-1)?.number ?? 0) + 1;
    versions.push(this.createVersion(nextVersionNumber, next));

    if (versions.length > HISTORY_LIMIT) versions.shift();

    this._versions.set(versions);
    this.activeIndex.set(versions.length - 1);
    this.fields.set(next);
  }

  /** Discards the history and starts a new one from `snapshot`. */
  reset(snapshot: FormFieldConfiguration): void {
    this._versions.set([this.createVersion(1, snapshot)]);
    this.activeIndex.set(0);
    this.fields.set(cloneValue(snapshot));
  }

  undo(): void {
    if (!this.canUndo()) return;

    const nextIndex = this.activeIndex() - 1;
    this.activeIndex.set(nextIndex);
    this.fields.set(cloneValue(this.versions()[nextIndex].snapshot));
  }

  redo(): void {
    if (!this.canRedo()) return;

    const nextIndex = this.activeIndex() + 1;
    this.activeIndex.set(nextIndex);
    this.fields.set(cloneValue(this.versions()[nextIndex].snapshot));
  }

  restore(versionId: string): void {
    const index = this.versions().findIndex((version) => version.id === versionId);

    if (index < 0) return;

    this.activeIndex.set(index);
    this.fields.set(cloneValue(this.versions()[index].snapshot));
  }

  private createVersion(number: number, snapshot: FormFieldConfiguration): FormTreeVersion {
    return {
      id: ulid(),
      number,
      createdAt: new Date(),
      snapshot: cloneValue(snapshot),
    };
  }
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => cloneValue(item)) as T;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  if (typeof value === 'object' && value !== null) {
    const prototype = Object.getPrototypeOf(value);

    if (prototype !== Object.prototype && prototype !== null) return value;

    const clone = Object.create(prototype) as Record<PropertyKey, unknown>;

    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);

      if (!descriptor) continue;
      if ('value' in descriptor) descriptor.value = cloneValue(descriptor.value);
      Object.defineProperty(clone, key, descriptor);
    }

    return clone as T;
  }

  return value;
}
