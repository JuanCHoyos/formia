import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';

import { FormlyForm } from '@ngx-formly/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { FieldTypeName } from '@/app/features/form-builder/formly/config/config-types';
import { BuilderMenuState } from '@/app/features/form-builder/services/builder-menu-state';
import { FieldConfigFactory } from '@/app/features/form-builder/services/field-config-factory';
import { FormBuilderStore } from '@/app/features/form-builder/services/form-builder-store';
import { HoverTrigger } from '@/app/ui/directives/hover-state';

import { type AppFormlyFieldConfig } from '../../../../formly/interfaces/app-formly-field-config';
import { BuilderWorkspaceEmptyState } from '../builder-workspace-empty-state/builder-workspace-empty-state';
import { BuilderWorkspaceFieldSelector } from '../builder-workspace-field-selector/builder-workspace-field-selector';
import { BuilderWorkspaceFormFieldHeader } from './builder-workspace-form-field-header/builder-workspace-form-field-header';

@Component({
  selector: 'app-builder-workspace-form-field',
  templateUrl: './builder-workspace-form-field.html',
  imports: [
    CommonModule,
    FormlyForm,
    BuilderWorkspaceFieldSelector,
    BuilderWorkspaceEmptyState,
    BuilderWorkspaceFormFieldHeader,
    HoverTrigger,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    TranslatePipe,
  ],
})
export class BuilderWorkspaceFormField {
  readonly field = input.required<AppFormlyFieldConfig>();
  dropEmit = output<CdkDragDrop<AppFormlyFieldConfig[]>>();

  readonly formBuilderStore = inject(FormBuilderStore);
  readonly fieldConfigFactory = inject(FieldConfigFactory);
  readonly builderMenuState = inject(BuilderMenuState);
  readonly translate = inject(TranslateService);

  readonly isHovered = signal(false);

  isContainerGroup = computed<boolean>(() => this.field().type === 'container-group');
  fieldGroup = computed<AppFormlyFieldConfig[]>(() => {
    const field = this.field();
    if (field.type !== 'container-group') return [];
    return field.fieldGroup;
  });

  isFieldSelected = computed<boolean>(() => {
    const selectedField = this.formBuilderStore.selectedField();
    if (!selectedField) return false;
    return selectedField.id === this.field().id;
  });

  readonly isFieldHighlighted = computed(() => this.isFieldSelected() || this.isHovered());

  addNewField(type: FieldTypeName, label: string, newIndex: number = 0) {
    const newFieldType = this.fieldConfigFactory.createFormFieldConf(
      type,
      this.translate.instant(label) as string,
    );
    const groupId = this.field().id;
    this.formBuilderStore.formTreeEditor.addFieldToGroup(groupId, newFieldType, newIndex);
  }

  edit(event: Event): void {
    const target = event.target;
    const currentTarget = event.currentTarget;

    if (
      !(target instanceof Element) ||
      !(currentTarget instanceof Element) ||
      target.closest('[data-builder-form-field]') !== currentTarget
    ) {
      return;
    }

    this.formBuilderStore.selectedField.set(this.field());
    this.builderMenuState.openRightMenu();
  }
}
