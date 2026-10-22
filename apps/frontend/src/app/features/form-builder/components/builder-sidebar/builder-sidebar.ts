import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TranslatePipe } from '@ngx-translate/core';

import { TabsModule } from 'primeng/tabs';

import { TreeSelector } from '@/app/ui/components/tree-selector/tree-selector';
import { Button } from '@ui/components/button/button';

import type { TreeItem, TreeSortableItem } from '../../../../ui/types/tree';
import { FIELD_TYPE_ICONS } from '../../formly/config/field-type-icons';
import {
  AppFormlyFieldConfig,
  FormPageContainer,
} from '../../formly/interfaces/app-formly-field-config';
import { BuilderMenuState } from '../../services/builder-menu-state';
import { FormBuilderStore } from '../../services/form-builder-store';
import { BuilderSidebarComponents } from './builder-sidebar-components/builder-sidebar-components';

@Component({
  selector: 'app-builder-sidebar',
  templateUrl: './builder-sidebar.html',
  imports: [
    CommonModule,
    FormsModule,
    Button,
    TabsModule,
    TranslatePipe,
    BuilderSidebarComponents,
    TreeSelector,
  ],
})
export class BuilderSidebar {
  readonly menuState = inject(BuilderMenuState);
  readonly formBuilderStore = inject(FormBuilderStore);

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
          ? this.buildTreeItems(field.fieldGroup, level + 1)
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

  edit(field: AppFormlyFieldConfig | FormPageContainer | null): void {
    this.formBuilderStore.selectedField.set(field);
    this.menuState.openRightMenu();
  }

  onSort(event: TreeSortableItem<AppFormlyFieldConfig | FormPageContainer>): void {
    console.log(event);
    if (event.isPrincipal) {
      this.formBuilderStore.formTreeEditor.movePage(event.itemId, event.newIndex);
      return;
    }

    this.formBuilderStore.formTreeEditor.moveField(
      event.from,
      event.to,
      event.itemId,
      event.newIndex,
    );
  }
}
