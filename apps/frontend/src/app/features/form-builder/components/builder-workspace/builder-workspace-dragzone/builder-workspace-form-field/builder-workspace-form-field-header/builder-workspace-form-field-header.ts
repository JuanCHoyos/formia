import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input, signal } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { MenuModule } from 'primeng/menu';

import { FIELD_PALETTE } from '@/app/features/form-builder/constants/field-palette-group';
import { FormBuilderStore } from '@/app/features/form-builder/services/form-builder-store';
import { AppFormlyFieldConfig } from '@/app/formly/types/app-formly-field-config';
import { Button } from '@/app/ui/components/button/button';
import { APP_ICONS } from '@/app/ui/constants/icons';
import { AppIcon } from '@/app/ui/types/icons';

import type { MenuActionItem } from '../../../../../types/menu-action-item';
import { BuilderWorkspaceFormMove } from '../builder-workspace-form-move/builder-workspace-form-move';
@Component({
  selector: 'app-builder-workspace-form-field-header',
  templateUrl: './builder-workspace-form-field-header.html',
  styleUrls: ['./builder-workspace-form-field-header.scss'],
  imports: [Button, TranslatePipe, DynamicDialogModule, MenuModule, NgIcon, CdkDragHandle],
  providers: [provideIcons(APP_ICONS), DialogService],
})
export class BuilderWorkspaceFormFieldHeader {
  readonly field = input.required<AppFormlyFieldConfig>();
  readonly isFieldHighlighted = input<boolean>(false);

  readonly dialogService = inject(DialogService);
  readonly formBuilderStore = inject(FormBuilderStore);
  readonly translate = inject(TranslateService);
  readonly menuActionItems = signal<MenuActionItem[]>([
    {
      label: 'formBuilder.workspace.fieldActions.duplicate',
      icon: 'lucideCopy',
      severity: 'secondary',
      command: () => this.duplicate(),
      customClass: 'text-text-2',
    },
    {
      label: 'formBuilder.workspace.fieldActions.move',
      icon: 'lucideArrowRightLeft',
      severity: 'secondary',
      command: () => this.move(),
      customClass: 'text-text-2',
    },
    {
      label: 'formBuilder.workspace.fieldActions.delete',
      icon: 'lucideTrash2',
      severity: 'danger',
      command: () => this.delete(),
      customClass: 'text-danger-text',
    },
  ]);

  readonly currentFieldIconLabel = computed<{ label: string; icon: AppIcon }>(() => {
    const field = this.field();

    const selectedFieldPalette = FIELD_PALETTE.flatMap(
      (fieldPaletteItem) => fieldPaletteItem.items,
    ).find(({ type }) => type === field.type);

    if (!selectedFieldPalette) return { label: '', icon: 'lucideAlertOctagon' };

    return { label: selectedFieldPalette.label, icon: selectedFieldPalette.icon };
  });

  duplicate(): void {
    this.formBuilderStore.formTreeEditor.duplicateElement(this.field().id);
  }

  delete(): void {
    this.formBuilderStore.formTreeEditor.confirmFieldDeletion(this.field().id);
  }

  move() {
    this.dialogService.open<BuilderWorkspaceFormMove, { field: AppFormlyFieldConfig }>(
      BuilderWorkspaceFormMove,
      {
        draggable: false,
        showHeader: true,
        dismissableMask: true,
        header: this.translate.instant('formBuilder.workspace.moveOrCopyField'),
        closable: true,
        width: '360px',
        data: {
          field: this.field(),
        },
      },
    );
  }
}
