import { Component, inject, input, signal } from '@angular/core';
import { APP_ICONS } from '@/app/ui/constants/icons';
import { type AppFormlyFieldConfig } from '../../../../formly/interfaces/app-formly-field-config';
import { FormBuilderStore } from '@/app/features/form-builder/services/form-builder-store';
import { CommonModule } from '@angular/common';
import { BuilderWorkspaceEmptyState } from '../builder-workspace-empty-state/builder-workspace-empty-state';
import { FieldConfigFactory } from '@/app/features/form-builder/services/field-config-factory';
import { FieldTypeName } from '@/app/features/form-builder/formly/config/config-types';
import { BuilderMenuState } from '@/app/features/form-builder/services/builder-menu-state';
import { TranslateService } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BuilderWorkspaceFormField } from '../builder-workspace-form-field/builder-workspace-form-field';
import { provideIcons } from '@ng-icons/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { FieldPaletteFieldItem } from '@/app/features/form-builder/types/field-palette';

@Component({
  selector: 'app-builder-workspace-form-page',
  templateUrl: './builder-workspace-form-page.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BuilderWorkspaceFormField,
    BuilderWorkspaceEmptyState,
    CdkDropList,
    CdkDrag,
  ],
  providers: [provideIcons(APP_ICONS)],
})
export class BuilderWorkspaceFormPage {
  readonly formFields = input.required<AppFormlyFieldConfig[]>();
  readonly formPageId = input.required<string>();

  readonly formBuilderStore = inject(FormBuilderStore);
  readonly fieldConfigFactory = inject(FieldConfigFactory);
  readonly builderMenuState = inject(BuilderMenuState);
  readonly translate = inject(TranslateService);

  whileDragging = signal<boolean>(false);

  addNewField(type: FieldTypeName, label: string, newIndex: number = 0) {
    const newFieldType = this.fieldConfigFactory.createFormFieldConf(
      type,
      this.translate.instant(label) as string,
    );

    this.formBuilderStore.formTreeEditor.addFieldToGroup(this.formPageId(), newFieldType, newIndex);
  }

  drop(
    event: CdkDragDrop<
      AppFormlyFieldConfig[],
      AppFormlyFieldConfig[],
      AppFormlyFieldConfig | FieldPaletteFieldItem
    >,
  ) {
    const { previousContainer, container, currentIndex, item } = event;
    if ('bgIcon' in item.data) {
      this.addField(
        item.data.type,
        this.translate.instant(item.data.label),
        currentIndex,
        container.id,
      );
      return;
    }

    if (event.previousContainer === event.container) {
      this.moveField(previousContainer.id, container.id, item.data.id, currentIndex);
      return;
    }

    this.moveField(previousContainer.id, container.id, item.data.id, currentIndex);
  }
  addField(type: FieldTypeName, label: string, newIndex: number, parentId: string) {
    const newField = this.fieldConfigFactory.createFormFieldConf(
      type,
      this.translate.instant(label) as string,
    );

    this.formBuilderStore.formTreeEditor.addFieldToGroup(parentId, newField, newIndex);
  }

  moveField(fromParentId: string, toParentId: string, fieldId: string, newIndex: number) {
    this.formBuilderStore.formTreeEditor.moveField(fromParentId, toParentId, fieldId, newIndex);
  }
}
