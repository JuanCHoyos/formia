import { Component, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { SelectItemGroup } from 'primeng/api';
import { SelectChangeEvent, SelectModule } from 'primeng/select';

import { FIELD_PALETTE } from '@/app/features/form-builder/constants/field-palette-group';
import { FieldPaletteFieldItem } from '@/app/features/form-builder/types/field-palette';
import { APP_ICONS } from '@/app/ui/constants/icons';

@Component({
  selector: 'app-builder-workspace-field-selector',
  templateUrl: './builder-workspace-field-selector.html',
  imports: [FormsModule, SelectModule, NgIcon, TranslatePipe],
  providers: [provideIcons(APP_ICONS)],
})
export class BuilderWorkspaceFieldSelector {
  fieldSelected = output<FieldPaletteFieldItem>();
  selectedcOMPONENT = model<FieldPaletteFieldItem | null>();

  readonly availableFieldGroups = signal<SelectItemGroup[]>(
    FIELD_PALETTE.map((group) => ({
      label: group.label,
      value: group.label,
      items: group.items.map((item) => ({ label: item.label, value: item })),
    })),
  );

  onAddComponent($event: SelectChangeEvent) {
    this.fieldSelected.emit($event.value);
    setTimeout(() => {
      this.selectedcOMPONENT.set(null);
    }, 50);
  }
}
