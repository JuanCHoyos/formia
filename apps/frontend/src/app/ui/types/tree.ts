export interface TreeDragData {
  id: string;
  /** Root items (pages) can only be reordered among themselves. */
  isPrincipal: boolean;
  /** Containers below the root can only be dropped into root containers. */
  isContainer: boolean;
}

export interface TreeItem<T> {
  id: string;
  label: string;
  icon: string;
  type: 'Field' | 'Group';
  items: TreeItem<T>[];
  value: T;
}

export interface TreeSortableItem<_T> {
  from: string;
  to: string;
  itemId: string;
  oldIndex: number;
  newIndex: number;
  isPrincipal?: boolean;
}
