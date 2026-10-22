import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Component, computed, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TranslatePipe } from '@ngx-translate/core';
import { Search } from '@primeicons/angular/search';

import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { z } from 'zod';

import { normalizeSearchText } from '@/app/ui/utils/search.utils';

import type { TreeDragData, TreeItem, TreeSortableItem } from '../../types/tree';
import { TreeSelectorItem } from './tree-selector-item/tree-selector-item';

export const TREE_ROOT_PARENT_ID = '__tree_root__';
export const TREE_ROOT_DROP_LIST_ID = 'tree-root-drop-list';

export const TreeSortableItemSchema = z.object({
  from: z.string(),
  to: z.string(),
  itemId: z.string(),
  oldIndex: z.number(),
  newIndex: z.number(),
  isPrincipal: z.boolean().optional(),
});

@Component({
  selector: 'app-tree-selector',
  templateUrl: './tree-selector.html',
  imports: [
    FormsModule,
    TreeSelectorItem,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    Search,
    TranslatePipe,
    CdkDropList,
    CdkDropListGroup,
  ],
})
export class TreeSelector<T> {
  sort = input<boolean>(false);
  items = input<TreeItem<T>[]>([]);
  maxContentHeight = input<string>('100%');
  search = input<boolean>(false);
  isPrincipalItemDisabled = input<boolean>(false);
  sortedItems = output<TreeSortableItem<T>>();
  readonly rootParentId = TREE_ROOT_PARENT_ID;
  readonly rootDropListId = TREE_ROOT_DROP_LIST_ID;
  readonly canDrop = (drag: CdkDrag<TreeDragData>, drop: CdkDropList<string>): boolean =>
    drag.data.isPrincipal === (drop.id === TREE_ROOT_DROP_LIST_ID);
  searchTerm = model<string>('');
  selectedItem = model<T | null>(null);

  filteredItems = computed<TreeItem<T>[]>(() => {
    if (!this.search()) return this.items();
    const query = normalizeSearchText(this.searchTerm());

    const filterItems = (items: TreeItem<T>[]): TreeItem<T>[] => {
      return items
        .map((item) => ({
          ...item,
          showItems: true,
          items: filterItems(item.items),
        }))
        .filter((item) => {
          const label = normalizeSearchText(item.label);
          const type = normalizeSearchText(item.type);

          return !query || label.includes(query) || type.includes(query) || item.items.length > 0;
        });
    };

    return filterItems(this.items());
  });

  dropListIds = computed(() => [
    this.rootDropListId,
    ...this.collectDropListIds(this.filteredItems()),
  ]);

  drop(event: CdkDragDrop<string, string, TreeDragData>) {
    if (event.previousIndex === event.currentIndex) return;

    const parsed = TreeSortableItemSchema.safeParse({
      from: event.previousContainer.data,
      to: event.container.data,
      itemId: event.item.data.id,
      oldIndex: event.previousIndex,
      newIndex: event.currentIndex,
      isPrincipal: true,
    });

    if (!parsed.success) return;

    this.sortedItems.emit(parsed.data);
  }

  private collectDropListIds(items: TreeItem<T>[]): string[] {
    return items.flatMap((item) => {
      if (item.type !== 'Group') return [];
      return [`tree-list-${item.id}`, ...this.collectDropListIds(item.items)];
    });
  }
}
