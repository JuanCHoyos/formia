import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDragPreview,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { Component, computed, inject, input, output, signal } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { FormlyForm } from '@ngx-formly/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { FIELD_PALETTE } from '@/app/features/form-builder/constants/field-palette-group';
import { BuilderDragState } from '@/app/features/form-builder/services/builder-drag-state';
import { BuilderMenuState } from '@/app/features/form-builder/services/builder-menu-state';
import { FieldConfigFactory } from '@/app/features/form-builder/services/field-config-factory';
import { FormBuilderStore } from '@/app/features/form-builder/services/form-builder-store';
import { FieldTypeName } from '@/app/formly/config/config-types';
import { APP_ICONS } from '@/app/ui/constants/icons';
import { HoverTrigger } from '@/app/ui/directives/hover-state';
import type { AppIcon } from '@/app/ui/types/icons';

import { type AppFormlyFieldConfig } from '../../../../../../formly/types/app-formly-field-config';
import { BuilderWorkspaceFieldSelector } from '../builder-workspace-field-selector/builder-workspace-field-selector';
import { BuilderWorkspaceFormFieldHeader } from './builder-workspace-form-field-header/builder-workspace-form-field-header';

@Component({
  selector: 'app-builder-workspace-form-field',
  templateUrl: './builder-workspace-form-field.html',
  imports: [
    FormlyForm,
    BuilderWorkspaceFieldSelector,
    BuilderWorkspaceFormFieldHeader,
    HoverTrigger,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    CdkDragPreview,
    NgIcon,
    TranslatePipe,
  ],
  providers: [provideIcons(APP_ICONS)],
})
export class BuilderWorkspaceFormField {
  readonly field = input.required<AppFormlyFieldConfig>();
  dropEmit = output<CdkDragDrop<AppFormlyFieldConfig[]>>();

  readonly formBuilderStore = inject(FormBuilderStore);
  readonly fieldConfigFactory = inject(FieldConfigFactory);
  readonly builderMenuState = inject(BuilderMenuState);
  readonly translate = inject(TranslateService);

  readonly dragState = inject(BuilderDragState);

  readonly isHovered = signal(false);

  private readonly paletteItem = computed(() =>
    FIELD_PALETTE.flatMap((group) => group.items).find(({ type }) => type === this.field().type),
  );
  readonly previewIcon = computed<AppIcon>(() => this.paletteItem()?.icon ?? 'lucideFile');
  readonly previewText = computed(() => {
    const props: object = this.field().props;
    const label = 'label' in props && typeof props.label === 'string' ? props.label : '';
    return label || (this.translate.instant(this.paletteItem()?.label ?? '') as string);
  });

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
