import type { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import type { ModelSignal, Signal } from '@angular/core';

import type { TreeDragData } from '../../types/tree';

/**
 * State and behavior that `TreeSelector` shares with every nested `TreeSelectorItem`, so items
 * don't relay inputs and outputs through each level. Lives apart from both components to avoid
 * a circular import between them.
 */
export abstract class TreeSelectorContext<T> {
  abstract readonly selectedItem: ModelSignal<T | null>;
  abstract readonly isPrincipalItemDisabled: Signal<boolean>;
  /** Dragging is enabled only when sorting is on and no search filter is applied. */
  abstract readonly sortable: Signal<boolean>;
  abstract readonly dragging: Signal<boolean>;
  abstract readonly dropListIds: Signal<string[]>;

  abstract isExpanded(id: string): boolean;
  abstract toggle(id: string): void;
  abstract expand(id: string): void;

  /** `ownerDepth` is the depth of the container that owns the list, `null` for the root list. */
  abstract canEnter(
    drag: CdkDrag<TreeDragData>,
    drop: CdkDropList<string>,
    ownerDepth: number | null,
  ): boolean;

  /** Emits the move described by a drop; `appendIndex` overrides the index for collapsed lists. */
  abstract handleDrop(event: CdkDragDrop<string, string, TreeDragData>, appendIndex?: number): void;

  abstract dragStarted(): void;
  abstract dragEnded(): void;
}
