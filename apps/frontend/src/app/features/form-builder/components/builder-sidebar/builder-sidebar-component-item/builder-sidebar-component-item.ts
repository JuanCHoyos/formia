import { Component, input, signal } from '@angular/core';
import { APP_ICONS } from '@/app/ui/constants/icons';
import type { FieldPaletteFieldItem } from '@/app/features/form-builder/types/field-palette';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { NgIcon, provideIcons } from '@ng-icons/core';

@Component({
  selector: 'app-builder-sidebar-component-item',
  templateUrl: './builder-sidebar-component-item.html',
  imports: [CommonModule, CdkDrag, TranslatePipe, NgIcon],
  providers: [provideIcons(APP_ICONS)],
})
export class BuilderSidebarComponentItem {
  item = input.required<FieldPaletteFieldItem>();
}
