import { CdkDrag } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import type { FieldPaletteFieldItem } from '@/app/features/form-builder/types/field-palette';
import { APP_ICONS } from '@/app/ui/constants/icons';

@Component({
  selector: 'app-builder-sidebar-component-item',
  templateUrl: './builder-sidebar-component-item.html',
  imports: [CommonModule, CdkDrag, TranslatePipe, NgIcon],
  providers: [provideIcons(APP_ICONS)],
})
export class BuilderSidebarComponentItem {
  item = input.required<FieldPaletteFieldItem>();
}
