import { ulid } from 'ulid';

import { Notifications } from '@/app/ui/services/notifications';

import { FieldTypeName } from '../formly/config/config-types';
import {
  AppFormlyFieldConfig,
  FormPageContainer,
} from '../formly/interfaces/app-formly-field-config';
import { ContainerFieldTypeConfig } from '../formly/interfaces/field-types/container-field';
import { FormTreeHistory } from './form-tree-history';

export class FormTreeEditor {
  private readonly history: FormTreeHistory;
  private readonly notifications: Notifications;

  constructor(history: FormTreeHistory, notifications: Notifications) {
    this.history = history;
    this.notifications = notifications;
  }

  addFieldToGroup(parentId: string, newField: AppFormlyFieldConfig, newIndex?: number): void {
    if (!this.isNestingAllowed(parentId, newField.type)) {
      return this.notifications.warn(
        'formBuilder.messages.cannotNestContainer.title',
        'formBuilder.messages.cannotNestContainer.detail',
      );
    }

    this.history.update((state) => ({
      ...state,
      fieldGroup: state.fieldGroup.map((page) => {
        if (page.id === parentId) {
          return { ...page, fieldGroup: this.addField(page.fieldGroup, newField, newIndex) };
        }
        return {
          ...page,
          fieldGroup: this.addFieldToContainer(page.fieldGroup, parentId, newField, newIndex),
        };
      }),
    }));
  }

  movePage(pageId: string, newIndex: number): boolean {
    const pages = this.history.fields().fieldGroup;
    const sourceIndex = pages.findIndex((page) => page.id === pageId);

    if (sourceIndex < 0) {
      this.notifications.error(
        'formBuilder.messages.fieldMoveFailed.title',
        'formBuilder.messages.fieldMoveFailed.detail',
      );
      return false;
    }

    if (sourceIndex === newIndex) return false;

    const nextPages = pages.slice();
    const [page] = nextPages.splice(sourceIndex, 1);
    const targetIndex = Math.max(0, Math.min(newIndex, nextPages.length));
    nextPages.splice(targetIndex, 0, page);

    this.history.update((state) => ({ ...state, fieldGroup: nextPages }));
    return true;
  }

  moveField(fromParentId: string, toParentId: string, fieldId: string, newIndex: number): boolean {
    const fields = this.history.fields();
    const sourceGroup = this.findParentGroup(fields.fieldGroup, fromParentId);
    const sourceIndex = sourceGroup?.findIndex((field) => field.id === fieldId) ?? -1;
    const field = sourceGroup?.[sourceIndex];

    if (!field || sourceIndex < 0) {
      this.notifications.error(
        'formBuilder.messages.fieldMoveFailed.title',
        'formBuilder.messages.fieldMoveFailed.detail',
      );
      return false;
    }

    if (fromParentId === toParentId && sourceIndex === newIndex) return false;

    if (!this.findParentGroup(fields.fieldGroup, toParentId)) {
      this.notifications.error(
        'formBuilder.messages.fieldMoveFailed.title',
        'formBuilder.messages.fieldMoveFailed.detail',
      );
      return false;
    }

    if (!this.isNestingAllowed(toParentId, field.type)) {
      this.notifications.warn(
        'formBuilder.messages.cannotNestContainer.title',
        'formBuilder.messages.cannotNestContainer.detail',
      );
      return false;
    }

    const removed = this.updateParentGroup(fields.fieldGroup, fromParentId, (group) =>
      group.filter((item) => item.id !== fieldId),
    );
    if (!removed.found) return false;

    const destination = this.findParentGroup(removed.pages, toParentId);
    if (!destination) return false;

    const targetIndex = Math.max(0, Math.min(newIndex, destination.length));
    const inserted = this.updateParentGroup(removed.pages, toParentId, (group) =>
      this.addField(group, field, targetIndex),
    );
    if (!inserted.found) return false;

    this.history.update((state) => ({ ...state, fieldGroup: inserted.pages }));
    return true;
  }

  private isNestingAllowed(parentId: string, newFieldType: FieldTypeName): boolean {
    const fields = this.history.fields();

    if (fields.fieldGroup.some((page) => page.id === parentId)) return true;
    return newFieldType !== 'container-group';
  }

  private findParentGroup(
    pages: FormPageContainer[],
    parentId: string,
  ): AppFormlyFieldConfig[] | undefined {
    const page = pages.find((item) => item.id === parentId);
    if (page) return page.fieldGroup;

    for (const pageItem of pages) {
      const group = this.findContainerGroup(pageItem.fieldGroup, parentId);
      if (group) return group;
    }

    return undefined;
  }

  private findContainerGroup(
    fields: AppFormlyFieldConfig[],
    parentId: string,
  ): AppFormlyFieldConfig[] | undefined {
    for (const field of fields) {
      if (field.type !== 'container-group') continue;
      if (field.id === parentId) return field.fieldGroup;

      const group = this.findContainerGroup(field.fieldGroup, parentId);
      if (group) return group;
    }

    return undefined;
  }

  private updateParentGroup(
    pages: FormPageContainer[],
    parentId: string,
    update: (group: AppFormlyFieldConfig[]) => AppFormlyFieldConfig[],
  ): { pages: FormPageContainer[]; found: boolean } {
    let found = false;
    const nextPages = pages.map((page) => {
      if (page.id === parentId) {
        found = true;
        return { ...page, fieldGroup: update(page.fieldGroup) };
      }

      const nested = this.updateContainerGroup(page.fieldGroup, parentId, update);
      if (!nested.found) return page;

      found = true;
      return { ...page, fieldGroup: nested.fields };
    });

    return { pages: nextPages, found };
  }

  private updateContainerGroup(
    fields: AppFormlyFieldConfig[],
    parentId: string,
    update: (group: AppFormlyFieldConfig[]) => AppFormlyFieldConfig[],
  ): { fields: AppFormlyFieldConfig[]; found: boolean } {
    let found = false;
    const nextFields = fields.map((field) => {
      if (field.type !== 'container-group') return field;

      if (field.id === parentId) {
        found = true;
        return { ...field, fieldGroup: update(field.fieldGroup) };
      }

      const nested = this.updateContainerGroup(field.fieldGroup, parentId, update);
      if (!nested.found) return field;

      found = true;
      return { ...field, fieldGroup: nested.fields };
    });

    return { fields: nextFields, found };
  }

  private addFieldToContainer(
    fieldGroup: AppFormlyFieldConfig[],
    parentId: string,
    newField: AppFormlyFieldConfig,
    newIndex?: number,
  ) {
    return fieldGroup.map((field) => {
      if (field.type === 'container-group' && parentId === field.id) {
        const container = field as ContainerFieldTypeConfig;
        return {
          ...container,
          fieldGroup: this.addField(container.fieldGroup, newField, newIndex),
        };
      }
      return field;
    });
  }

  private addField<T>(fieldGroup: T[], newField: AppFormlyFieldConfig, newIndex?: number): T[] {
    const position = newIndex ?? fieldGroup.length;
    return [
      ...fieldGroup.slice(0, position),
      newField as unknown as T,
      ...fieldGroup.slice(position),
    ];
  }

  confirmFieldDeletion(id: string) {
    this.notifications.confirmDestructive({
      titleKey: 'formBuilder.confirmations.deleteField.title',
      messageKey: 'formBuilder.confirmations.deleteField.message',
      accept: () => {
        this.removeFieldFromGroup(id);
      },
    });
  }

  removeFieldFromGroup(id: string): void {
    if (!this.isFormPageRemovable(this.history.fields().fieldGroup, id)) {
      this.notifications.warn(
        'formBuilder.messages.cannotDeleteLastPage.title',
        'formBuilder.messages.cannotDeleteLastPage.detail',
      );
      return;
    }
    this.history.update((state) => ({
      ...state,
      fieldGroup: this.removeFormPageById(state.fieldGroup, id).map((page) => ({
        ...page,
        fieldGroup: this.removeFieldById(page.fieldGroup, id),
      })),
    }));

    this.notifications.success(
      'formBuilder.messages.fieldDeleted.title',
      'formBuilder.messages.fieldDeleted.detail',
    );
  }

  private isFormPageRemovable(fieldGroup: FormPageContainer[], id: string) {
    return this.removeFormPageById(fieldGroup, id).length > 0;
  }

  private removeFormPageById(fieldGroup: FormPageContainer[], id: string) {
    return fieldGroup.filter((page) => page.id !== id);
  }

  private removeFieldById(fieldGroup: AppFormlyFieldConfig[], id: string) {
    return fieldGroup
      .filter((field) => field.id !== id)
      .map((field) => {
        if (field.type === 'container-group') {
          const container = field as ContainerFieldTypeConfig;
          return {
            ...container,
            fieldGroup: container.fieldGroup.filter((sub) => sub.id !== id),
          };
        }
        return field;
      });
  }

  updateElement(id: string, updatedData: Partial<AppFormlyFieldConfig | FormPageContainer>): void {
    this.history.update((state) => ({
      ...state,
      fieldGroup: state.fieldGroup.map((page) => {
        if (page.id === id) {
          return { ...page, ...updatedData } as FormPageContainer;
        }

        return {
          ...page,
          fieldGroup: page.fieldGroup.map((field) => {
            if (field.id === id) {
              return { ...field, ...updatedData } as AppFormlyFieldConfig;
            }

            if (field.type === 'container-group') {
              const container = field as ContainerFieldTypeConfig;
              return {
                ...container,
                fieldGroup: container.fieldGroup.map((sub) => {
                  if (sub.id === id) {
                    return { ...sub, ...updatedData } as Exclude<
                      AppFormlyFieldConfig,
                      'ContainerFieldTypeConfig'
                    >;
                  }
                  return sub;
                }),
              };
            }
            return field;
          }),
        };
      }),
    }));
  }

  duplicateElement(id: string): void {
    this.history.update((state) => ({
      ...state,
      fieldGroup: state.fieldGroup.flatMap((page) => {
        if (page.id === id) {
          return [page, this.cloneItem(page)];
        }

        return [
          {
            ...page,
            fieldGroup: page.fieldGroup.flatMap((field) => {
              if (field.id === id) {
                return [field, this.cloneItem(field)];
              }

              if (field.type === 'container-group') {
                const container = field as ContainerFieldTypeConfig;
                return [
                  {
                    ...container,
                    fieldGroup: container.fieldGroup.flatMap((sub) => {
                      if (sub.id === id) {
                        return [sub, this.cloneItem(sub)];
                      }
                      return [sub];
                    }),
                  },
                ];
              }
              return [field];
            }),
          },
        ];
      }),
    }));
  }

  private cloneItem<T extends AppFormlyFieldConfig | FormPageContainer>(item: T): T {
    const cloned = { ...item };

    cloned.id = ulid();

    if ('key' in cloned) {
      cloned.key = ulid();
    }

    if (cloned.type === 'container-group' && 'fieldGroup' in cloned) {
      cloned.fieldGroup = (cloned.fieldGroup as AppFormlyFieldConfig[]).map((sub) =>
        this.cloneItem(sub),
      ) as unknown as T extends FormPageContainer
        ? AppFormlyFieldConfig[]
        : Exclude<AppFormlyFieldConfig, 'ContainerFieldTypeConfig'>[];
    }

    return cloned;
  }
}
