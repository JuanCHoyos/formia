import { CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Search } from '@primeicons/angular/search';

import { AccordionModule } from 'primeng/accordion';
import type { AccordionValue } from 'primeng/accordion';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Options } from 'sortablejs';

import type {
  FieldPaletteGroup,
  FilteredFieldPaletteGroup,
} from '@/app/features/form-builder/types/field-palette';
import { normalizeSearchText } from '@/app/ui/utils/search.utils';

import { FIELD_PALETTE } from '../../../constants/field-palette-group';
import { FormBuilderStore } from '../../../services/form-builder-store';
import { BuilderSidebarComponentItem } from '../builder-sidebar-component-item/builder-sidebar-component-item';

@Component({
  selector: 'app-builder-sidebar-components',
  templateUrl: './builder-sidebar-components.html',
  imports: [
    CommonModule,
    FormsModule,
    AccordionModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    Search,
    CdkDropList,
    BuilderSidebarComponentItem,
    TranslatePipe,
  ],
})
export class BuilderSidebarComponents {
  private readonly translate = inject(TranslateService);
  readonly formBuilderStore = inject(FormBuilderStore);

  value = model<AccordionValue>([0]);
  searchTerm = model<string>('');
  fieldPalette = signal<FieldPaletteGroup[]>(FIELD_PALETTE);

  filteredGroups = computed<FilteredFieldPaletteGroup[]>(() => {
    this.translate.currentLang();
    const query = normalizeSearchText(this.searchTerm());

    return this.fieldPalette()
      .map((group, value) => ({
        ...group,
        value,
        items: group.items.filter((item) => {
          const label = normalizeSearchText(this.translate.instant(item.label) as string);
          const type = normalizeSearchText(item.type);

          return !query || label.includes(query) || type.includes(query);
        }),
      }))
      .filter((group) => group.items.length > 0);
  });

  accordionValue = computed(() =>
    this.searchTerm().trim() ? this.filteredGroups().map((group) => group.value) : this.value(),
  );

  readonly sortableOptions = signal<Options>({
    group: {
      name: 'form-fields',
      pull: 'clone',
      put: false,
    },
    sort: false,
  });
}
