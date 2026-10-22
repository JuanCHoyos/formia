import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, input, model, output } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { APP_ICONS } from '@/app/ui/constants/icons';

import type { TreeDragData, TreeItem, TreeSortableItem } from '../../../types/tree';
import { TreeSortableItemSchema, TREE_ROOT_DROP_LIST_ID } from '../tree-selector';
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
    CdkDragPlaceholder,
  ],
  providers: [provideIcons(APP_ICONS)],
})
export class TreeSelectorItem<T> {
  item = input.required<TreeItem<T>>();
  rootIndex = input.required<number>();
  dropListIds = input<string[]>([]);
  sort = input<boolean>(false);
  isPrincipalItemDisabled = input<boolean>(false);
  sortedItems = output<TreeSortableItem<T>>();
  readonly canDrop = (drag: CdkDrag<TreeDragData>, drop: CdkDropList<string>): boolean =>
    drag.data.isPrincipal === (drop.id === TREE_ROOT_DROP_LIST_ID);

  selectedItem = model<T | null>(null);
  paddingLeft = computed(() => `${8 + this.rootIndex()! * 32}px`);

  toggleSubItems(event: PointerEvent) {
    event.stopPropagation();
    if (this.item().type !== 'Group') return;
    this.item().showItems = !this.item().showItems;
  }

  selectItem() {
    if (this.isPrincipalItemDisabled() && this.rootIndex() === 0) return;
    this.selectedItem.set(this.item().value);
  }

  drop(event: CdkDragDrop<string, string, TreeDragData>) {
    if (event.previousIndex === event.currentIndex && event.previousContainer === event.container) {
      return;
    }

    const parsed = TreeSortableItemSchema.safeParse({
      from: event.previousContainer.data,
      to: event.container.data,
      itemId: event.item.data.id,
      oldIndex: event.previousIndex,
      newIndex: event.currentIndex,
    });

    if (parsed.success) this.sortedItems.emit(parsed.data);
  }
}
