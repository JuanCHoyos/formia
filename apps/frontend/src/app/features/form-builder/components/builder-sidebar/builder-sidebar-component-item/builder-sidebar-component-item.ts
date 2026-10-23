import { CdkDrag, CdkDragPlaceholder, CdkDragPreview } from '@angular/cdk/drag-drop';
import { Component, inject, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { BuilderDragState } from '@/app/features/form-builder/services/builder-drag-state';
import type { FieldPaletteFieldItem } from '@/app/features/form-builder/types/field-palette';
import { APP_ICONS } from '@/app/ui/constants/icons';

@Component({
  selector: 'app-builder-sidebar-component-item',
  templateUrl: './builder-sidebar-component-item.html',
  imports: [CdkDrag, CdkDragPlaceholder, CdkDragPreview, TranslatePipe, NgIcon],
  providers: [provideIcons(APP_ICONS)],
})
export class BuilderSidebarComponentItem {
  readonly dragState = inject(BuilderDragState);
  readonly item = input.required<FieldPaletteFieldItem>();
}
