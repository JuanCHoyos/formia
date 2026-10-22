import { Component, computed, inject, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { Button } from '@/app/ui/components/button/button';
import { APP_ICONS } from '@/app/ui/constants/icons';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormBuilderStore } from '@/app/features/form-builder/services/form-builder-store';
import { AppIcon } from '@/app/ui/types/icons';
import { ButtonSeverity } from 'primeng/button';
import { AppFormlyFieldConfig } from '@/app/features/form-builder/formly/interfaces/app-formly-field-config';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { BuilderMenuState } from '@/app/features/form-builder/services/builder-menu-state';
import { FieldConfigFactory } from '@/app/features/form-builder/services/field-config-factory';
import { BuilderWorkspaceFormMove } from '../builder-workspace-form-move/builder-workspace-form-move';
import { FIELD_PALETTE } from '@/app/features/form-builder/constants/field-palette-group';
import { MenuModule } from 'primeng/menu';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
type MenuActionItem = {
  label: string;
  icon: AppIcon;
  severity: ButtonSeverity;
  command: () => void;
  customClass: string;
};

@Component({
  selector: 'app-builder-workspace-form-field-header',
  templateUrl: './builder-workspace-form-field-header.html',
  styleUrls: ['./builder-workspace-form-field-header.scss'],
  imports: [
    CommonModule,
    Button,
    TranslatePipe,
    DynamicDialogModule,
    MenuModule,
    NgIcon,
    CdkDragHandle,
  ],
  providers: [provideIcons(APP_ICONS), DialogService],
})
export class BuilderWorkspaceFormFieldHeader {
  readonly field = input.required<AppFormlyFieldConfig>();
  readonly isFieldHighlighted = input<boolean>(false);

  readonly dialogService = inject(DialogService);
  readonly formBuilderStore = inject(FormBuilderStore);
  readonly fieldConfigFactory = inject(FieldConfigFactory);
  readonly builderMenuState = inject(BuilderMenuState);
  readonly translate = inject(TranslateService);
  readonly menuActionItems = signal<MenuActionItem[]>([
    {
      label: 'Copy',
      icon: 'lucideCopy',
      severity: 'contrast',
      command: () => this.cloned(),
      customClass: 'text-slate-500',
    },
    {
      label: 'Move Field',
      icon: 'lucideArrowRightLeft',
      severity: 'contrast',
      command: () => this.move(),
      customClass: 'text-slate-500',
    },
    {
      label: 'Delete',
      icon: 'lucideTrash2',
      severity: 'danger',
      command: () => this.delete(),
      customClass: 'text-slate-500 hover:bg-red-50 hover:text-danger',
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

  cloned(): void {
    //this.fieldConfigFactory.duplicate(field, index);
  }

  copyContainerField(field: AppFormlyFieldConfig): void {
    //this.fieldConfigFactory.duplicate(field, this.formBuilderStore.currentPageFields().length);
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
