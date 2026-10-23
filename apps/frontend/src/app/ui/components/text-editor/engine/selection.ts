import { BLOCK_TAGS, indexOf, isElement, type DomPosition } from './dom';

/** A selection stored as character offsets, so it survives replacing the editor's HTML. */
export interface TextRange {
  start: number;
  end: number;
}

type Token =
  | { kind: 'block'; node: HTMLElement }
  | { kind: 'break'; node: HTMLElement }
  | { kind: 'text'; node: Text };

/** Text nodes, block starts and line breaks in document order; each block start and break counts as one character. */
const tokens = (root: HTMLElement): Token[] => {
  const result: Token[] = [];
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
  );
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof Text) {
      result.push({ kind: 'text', node });
    } else if (isElement(node) && BLOCK_TAGS.has(node.tagName)) {
      result.push({ kind: 'block', node });
    } else if (isElement(node) && node.tagName === 'BR') {
      result.push({ kind: 'break', node });
    }
  }
  return result;
};

export const offsetOf = (root: HTMLElement, container: Node, offset: number): number => {
  const range = root.ownerDocument.createRange();
  range.setStart(root, 0);
  range.setEnd(container, offset);

  let count = 0;
  for (const token of tokens(root)) {
    if (token.kind === 'text') {
      if (token.node === container) {
        return count + offset;
      }
      if (range.comparePoint(token.node, token.node.length) !== 0) {
        return count;
      }
      count += token.node.length;
    } else if (token.kind === 'block') {
      if (range.comparePoint(token.node, 0) !== 0) {
        return count;
      }
      count += 1;
    } else {
      const parent = token.node.parentNode;
      if (!parent || range.comparePoint(parent, indexOf(token.node) + 1) !== 0) {
        return count;
      }
      count += 1;
    }
  }
  return count;
};

export const positionAt = (root: HTMLElement, target: number): DomPosition => {
  const list = tokens(root);
  let count = 0;

  for (let index = 0; index < list.length; index++) {
    const token = list[index];
    if (token.kind === 'text') {
      if (target <= count + token.node.length) {
        return { node: token.node, offset: Math.max(0, target - count) };
      }
      count += token.node.length;
    } else if (token.kind === 'block') {
      count += 1;
      if (target === count && list[index + 1]?.kind !== 'text') {
        return { node: token.node, offset: 0 };
      }
    } else {
      if (target === count && token.node.parentNode) {
        return { node: token.node.parentNode, offset: indexOf(token.node) };
      }
      count += 1;
    }
  }

  return { node: root, offset: root.childNodes.length };
};

/** The current selection range, only when it lies inside `root`. */
export const editorRange = (root: HTMLElement): Range | null => {
  const selection = root.ownerDocument.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  const range = selection.getRangeAt(0);
  return root.contains(range.startContainer) && root.contains(range.endContainer) ? range : null;
};

export const selectRange = (range: Range): void => {
  const selection = range.startContainer.ownerDocument?.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

export const saveSelection = (root: HTMLElement): TextRange | null => {
  const range = editorRange(root);
  return range
    ? {
        start: offsetOf(root, range.startContainer, range.startOffset),
        end: offsetOf(root, range.endContainer, range.endOffset),
      }
    : null;
};

export const restoreSelection = (root: HTMLElement, saved: TextRange): Range => {
  const start = positionAt(root, saved.start);
  const end = positionAt(root, saved.end);
  const range = root.ownerDocument.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  selectRange(range);
  return range;
};

export const caretAt = (position: DomPosition): Range => {
  const range = (position.node.ownerDocument ?? document).createRange();
  range.setStart(position.node, position.offset);
  range.collapse(true);
  return range;
};

const START_MARKER = 'te-selection-start';
const END_MARKER = 'te-selection-end';

/**
 * Runs `transform` on the content between two comment markers placed at the range edges.
 * Markers travel with the nodes they sit next to, so the selection is found again after blocks
 * are split, wrapped or moved. Returns a live range where the markers ended up, plus the
 * transform's own result.
 */
export const withMarkers = <T>(
  root: HTMLElement,
  range: Range,
  transform: (range: Range) => T,
): { range: Range; value: T } => {
  const doc = root.ownerDocument;
  const start = doc.createComment(START_MARKER);
  const end = doc.createComment(END_MARKER);

  const collapsed = range.collapsed;
  const endPoint = range.cloneRange();
  endPoint.collapse(false);
  endPoint.insertNode(end);
  const startPoint = range.cloneRange();
  startPoint.collapse(true);
  startPoint.insertNode(start);

  // Splitting a text node at its end leaves an empty text node between the markers; a caret must stay collapsed.
  const working = doc.createRange();
  working.setStartAfter(start);
  if (collapsed) {
    working.collapse(true);
  } else {
    working.setEndBefore(end);
  }
  const value = transform(working);

  const result = doc.createRange();
  if (root.contains(start) && root.contains(end)) {
    result.setStartBefore(start);
    result.setEndAfter(end);
  } else {
    const fallback = root.contains(end) ? end : root.contains(start) ? start : null;
    if (fallback) {
      result.setStartBefore(fallback);
    } else {
      result.setStart(root, root.childNodes.length);
    }
    result.collapse(true);
  }
  start.remove();
  end.remove();
  return { range: result, value };
};
