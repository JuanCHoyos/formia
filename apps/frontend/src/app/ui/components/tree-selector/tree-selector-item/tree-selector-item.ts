import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { Component, computed, inject, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { APP_ICONS } from '@/app/ui/constants/icons';

import type { TreeDragData, TreeItem } from '../../../types/tree';
import { TreeSelectorContext } from '../tree-selector.context';

@Component({
  selector: 'app-tree-selector-item',
  templateUrl: './tree-selector-item.html',
  imports: [
    TranslatePipe,
    ButtonModule,
    TooltipModule,
    NgIcon,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
  ],
  providers: [provideIcons(APP_ICONS)],
})
export class TreeSelectorItem<T> {
  protected readonly tree = inject<TreeSelectorContext<T>>(TreeSelectorContext);

  readonly item = input.required<TreeItem<T>>();
  readonly depth = input.required<number>();

  protected readonly isContainer = computed(() => this.item().type === 'Group');
  protected readonly expanded = computed(
    () => this.isContainer() && this.tree.isExpanded(this.item().id),
  );
  protected readonly selected = computed(() => this.tree.selectedItem() === this.item().value);
  protected readonly listId = computed(() => `tree-list-${this.item().id}`);
  protected readonly paddingLeft = computed(() => `${8 + this.depth() * 32}px`);
  protected readonly dragData = computed<TreeDragData>(() => ({
    id: this.item().id,
    isPrincipal: this.depth() === 0,
    isContainer: this.isContainer(),
  }));

  readonly canEnter = (drag: CdkDrag<TreeDragData>, drop: CdkDropList<string>): boolean =>
    this.tree.canEnter(drag, drop, this.depth());

  toggle(event: Event): void {
    event.stopPropagation();
    this.tree.toggle(this.item().id);
  }

  select(): void {
    if (this.tree.isPrincipalItemDisabled() && this.depth() === 0) return;
    this.tree.selectedItem.set(this.item().value);
  }

  drop(event: CdkDragDrop<string, string, TreeDragData>): void {
    this.tree.handleDrop(event);
  }

  /** A collapsed container takes the item at the end of its children and opens up. */
  dropOnCollapsed(event: CdkDragDrop<string, string, TreeDragData>): void {
    this.tree.handleDrop(event, this.item().items.length);
    this.tree.expand(this.item().id);
  }
}
