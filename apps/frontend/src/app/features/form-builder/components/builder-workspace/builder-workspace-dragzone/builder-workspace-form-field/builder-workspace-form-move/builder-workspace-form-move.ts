import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { SelectItemGroup } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SelectModule } from 'primeng/select';

import { FIELD_TYPE_ICONS } from '@/app/features/form-builder/formly/config/field-type-icons';
import {
  AppFormlyFieldConfig,
  FormPageContainer,
} from '@/app/features/form-builder/formly/interfaces/app-formly-field-config';
import { FormBuilderStore } from '@/app/features/form-builder/services/form-builder-store';
import { Button } from '@/app/ui/components/button/button';
import { TreeSelector } from '@/app/ui/components/tree-selector/tree-selector';

import type { TreeItem } from '../../../../../../../ui/types/tree';

@Component({
  selector: 'app-builder-workspace-form-move',
  templateUrl: './builder-workspace-form-move.html',
  imports: [CommonModule, Button, TranslatePipe, SelectModule, TreeSelector],
  providers: [],
})
export class BuilderWorkspaceFormMove {
  readonly dialogRef = inject(DynamicDialogRef<BuilderWorkspaceFormMove>);
  readonly dialogConfig = inject(DynamicDialogConfig<{ field: AppFormlyFieldConfig }>);
  readonly formBuilderStore = inject(FormBuilderStore);

  fields = signal<SelectItemGroup[]>([]);

  items = computed<TreeItem<AppFormlyFieldConfig | FormPageContainer>[]>(() => {
    return this.buildTreeItems(this.formBuilderStore.fields().fieldGroup, 0);
  });

  private buildTreeItems(
    fields: (AppFormlyFieldConfig | FormPageContainer)[],
    level: number,
  ): TreeItem<AppFormlyFieldConfig | FormPageContainer>[] {
    return fields.map((field) => ({
      id: field.id,
      label: this.getText(field),
      icon: FIELD_TYPE_ICONS[field.type],
      type: field.type === 'container-group' ? 'Group' : 'Field',
      value: field,
      items:
        'fieldGroup' in field && field.fieldGroup
          ? this.buildTreeItems(field.fieldGroup, level + 1).filter(
              (item) => item.id !== this.dialogConfig.data.field.id,
            )
          : [],
    }));
  }

  getText(field: AppFormlyFieldConfig | FormPageContainer): string {
    const props = field.props;
    if ('label' in props && props.label) {
      return props.label;
    }

    if ('text' in props && props.text) {
      return props.text;
    }
    return field.id;
  }

  selectedItem(item: TreeItem<AppFormlyFieldConfig | FormPageContainer>) {
    console.log(item);
  }
}
