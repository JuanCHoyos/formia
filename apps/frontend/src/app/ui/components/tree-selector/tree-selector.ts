import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  OnDestroy,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TranslatePipe } from '@ngx-translate/core';
import { Search } from '@primeicons/angular/search';

import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

import { normalizeSearchText } from '@/app/ui/utils/search.utils';

import type { TreeDragData, TreeItem, TreeSortableItem } from '../../types/tree';
import { TreeSelectorItem } from './tree-selector-item/tree-selector-item';
import {
  TREE_ROOT_DROP_LIST_ID,
  TREE_ROOT_PARENT_ID,
  TreeSortableItemSchema,
} from './tree-selector.constants';
import { TreeSelectorContext } from './tree-selector.context';

interface TreePath {
  id: string;
  ancestorIds: string[];
}

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
  ],
  providers: [{ provide: TreeSelectorContext, useExisting: forwardRef(() => TreeSelector) }],
})
export class TreeSelector<T> implements TreeSelectorContext<T>, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly sort = input<boolean>(false);
  readonly items = input<TreeItem<T>[]>([]);
  readonly maxContentHeight = input<string>('100%');
  readonly search = input<boolean>(false);
  readonly isPrincipalItemDisabled = input<boolean>(false);
  readonly sortedItems = output<TreeSortableItem<T>>();
  readonly searchTerm = model<string>('');
  readonly selectedItem = model<T | null>(null);

  readonly rootParentId = TREE_ROOT_PARENT_ID;
  readonly rootDropListId = TREE_ROOT_DROP_LIST_ID;

  private readonly collapsedIds = signal<ReadonlySet<string>>(new Set());
  private readonly isDragging = signal(false);
  readonly dragging = this.isDragging.asReadonly();
  private pointer: { x: number; y: number } | null = null;
  private revealedId: string | null = null;
  private stopTrackingPointer: (() => void) | null = null;

  private readonly query = computed(() =>
    this.search() ? normalizeSearchText(this.searchTerm()) : '',
  );
  readonly sortable = computed(() => this.sort() && !this.query());

  readonly filteredItems = computed<TreeItem<T>[]>(() => {
    const query = this.query();
    if (!query) return this.items();

    const filterItems = (items: TreeItem<T>[]): TreeItem<T>[] =>
      items
        .map((item) => ({ ...item, items: filterItems(item.items) }))
        .filter(
          (item) =>
            normalizeSearchText(item.label).includes(query) ||
            normalizeSearchText(item.type).includes(query) ||
            item.items.length > 0,
        );

    return filterItems(this.items());
  });

  readonly dropListIds = computed(() => [
    this.rootDropListId,
    ...this.collectDropListIds(this.filteredItems()),
  ]);

  readonly canEnterRoot = (drag: CdkDrag<TreeDragData>, drop: CdkDropList<string>): boolean =>
    this.canEnter(drag, drop, null);

  constructor() {
    effect(() => {
      const selected = this.selectedItem();
      const path = selected === null ? null : this.findPath(this.items(), selected, []);
      if (!path) {
        this.revealedId = null;
        return;
      }

      // The selected value is rebuilt on every edit; only reveal it again when the selection
      // moves to another item or when it ends up hidden inside a collapsed container.
      const collapsed = untracked(() => this.collapsedIds());
      const hidden = path.ancestorIds.some((id) => collapsed.has(id));
      if (path.id === this.revealedId && !hidden) return;

      this.revealedId = path.id;
      untracked(() => this.expandAll(path.ancestorIds));
      afterNextRender(() => this.scrollToItem(path.id), { injector: this.injector });
    });
  }

  ngOnDestroy(): void {
    this.stopTrackingPointer?.();
  }

  isExpanded(id: string): boolean {
    return !!this.query() || !this.collapsedIds().has(id);
  }

  toggle(id: string): void {
    this.collapsedIds.update((ids) => {
      const next = new Set(ids);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  expand(id: string): void {
    this.expandAll([id]);
  }

  canEnter(
    drag: CdkDrag<TreeDragData>,
    drop: CdkDropList<string>,
    ownerDepth: number | null,
  ): boolean {
    const { isPrincipal, isContainer } = drag.data;
    const allowed =
      ownerDepth === null ? isPrincipal : !isPrincipal && (!isContainer || ownerDepth === 0);

    return allowed && this.isInnermostListUnderPointer(drop);
  }

  handleDrop(event: CdkDragDrop<string, string, TreeDragData>, appendIndex?: number): void {
    const newIndex = appendIndex ?? event.currentIndex;
    if (event.previousContainer === event.container && event.previousIndex === newIndex) return;

    const parsed = TreeSortableItemSchema.safeParse({
      from: event.previousContainer.data,
      to: event.container.data,
      itemId: event.item.data.id,
      oldIndex: event.previousIndex,
      newIndex,
      isPrincipal: event.item.data.isPrincipal,
    });

    if (parsed.success) this.sortedItems.emit(parsed.data);
  }

  dragStarted(): void {
    this.stopTrackingPointer?.();
    this.pointer = null;
    const track = (event: PointerEvent) => (this.pointer = { x: event.clientX, y: event.clientY });
    this.document.addEventListener('pointermove', track, true);
    this.stopTrackingPointer = () => this.document.removeEventListener('pointermove', track, true);
    this.isDragging.set(true);
  }

  dragEnded(): void {
    this.stopTrackingPointer?.();
    this.stopTrackingPointer = null;
    this.pointer = null;
    this.isDragging.set(false);
  }

  /**
   * The CDK hands the item to the first connected list that contains the pointer, so an outer
   * list would win over the nested one under it. Only the innermost list may receive it. Before
   * the pointer moves (while the CDK measures the lists at drag start) every list qualifies.
   */
  private isInnermostListUnderPointer(drop: CdkDropList<string>): boolean {
    if (!this.pointer) return true;

    const target = this.document.elementFromPoint(this.pointer.x, this.pointer.y);
    return target?.closest('.cdk-drop-list') === drop.element.nativeElement;
  }

  private expandAll(ids: string[]): void {
    this.collapsedIds.update((collapsed) => {
      if (!ids.some((id) => collapsed.has(id))) return collapsed;
      const next = new Set(collapsed);
      for (const id of ids) next.delete(id);
      return next;
    });
  }

  private findPath(items: TreeItem<T>[], value: T, ancestorIds: string[]): TreePath | null {
    for (const item of items) {
      if (item.value === value) return { id: item.id, ancestorIds };
      const path = this.findPath(item.items, value, [...ancestorIds, item.id]);
      if (path) return path;
    }
    return null;
  }

  private scrollToItem(id: string): void {
    this.host.nativeElement
      .querySelector(`[data-tree-item-id="${id}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }

  private collectDropListIds(items: TreeItem<T>[]): string[] {
    return items.flatMap((item) => {
      if (item.type !== 'Group') return [];
      return [`tree-list-${item.id}`, ...this.collectDropListIds(item.items)];
    });
  }
}
