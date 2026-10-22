export interface TreeDragData {
  id: string;
  isPrincipal: boolean;
}

export interface TreeItem<T> {
  id: string;
  label: string;
  icon: string;
  type: 'Field' | 'Group';
  items: TreeItem<T>[];
  showItems?: boolean;
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
