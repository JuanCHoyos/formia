import { z } from 'zod';

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
