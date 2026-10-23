import { deleteSelection } from './blocks';
import {
  inlineChildren,
  indexOf,
  isBlockEmpty,
  isElement,
  isList,
  lastTextPosition,
  LIST_TAGS,
  renameElement,
  TEXT_BLOCK_TAGS,
  textBlockOf,
  type DomPosition,
} from './dom';

/** Plain text as paragraphs, one per line. */
export const plainTextToHtml = (doc: Document, text: string): string => {
  const container = doc.createElement('div');
  for (const line of text.split(/\r\n|\r|\n/)) {
    const paragraph = doc.createElement('p');
    paragraph.textContent = line;
    container.appendChild(paragraph);
  }
  return container.innerHTML;
};

/** Pasted blocks as items of the list the caret is in. */
const toListItems = (doc: Document, nodes: readonly Node[]): HTMLElement[] => {
  const items: HTMLElement[] = [];
  for (const node of nodes) {
    if (!isElement(node)) {
      continue;
    }
    if (LIST_TAGS.has(node.tagName)) {
      items.push(
        ...Array.from(node.children).filter(
          (child): child is HTMLElement => child instanceof HTMLElement,
        ),
      );
    } else if (TEXT_BLOCK_TAGS.has(node.tagName)) {
      items.push(node.tagName === 'LI' ? node : renameElement(node, 'li'));
    } else if (node.tagName === 'BLOCKQUOTE') {
      items.push(...toListItems(doc, Array.from(node.childNodes)));
    }
  }
  return items;
};

/**
 * Inserts sanitized HTML at the range. A single paragraph is inserted inline; several blocks
 * split the current block around them. Returns the caret position after the inserted content.
 */
export const insertHtml = (root: HTMLElement, range: Range, html: string): DomPosition => {
  const doc = root.ownerDocument;
  deleteSelection(root, range);

  const template = doc.createElement('template');
  template.innerHTML = html;
  const nodes = Array.from(template.content.childNodes);
  const first = nodes[0];

  if (nodes.length === 1 && isElement(first) && first.tagName === 'P') {
    const fragment = doc.createDocumentFragment();
    Array.from(first.childNodes).forEach((child) => fragment.appendChild(child));
    const last = fragment.lastChild;
    range.insertNode(fragment);
    if (last instanceof Text) {
      return { node: last, offset: last.length };
    }
    return last?.parentNode
      ? { node: last.parentNode, offset: indexOf(last) + 1 }
      : { node: range.startContainer, offset: range.startOffset };
  }

  const block = textBlockOf(range.startContainer, root);
  if (!block) {
    root.append(...nodes);
    const last = root.lastElementChild;
    return last instanceof HTMLElement
      ? lastTextPosition(last)
      : { node: root, offset: root.childNodes.length };
  }

  const tail = doc.createRange();
  tail.setStart(range.startContainer, range.startOffset);
  const firstList = Array.from(block.childNodes).find(isList);
  if (firstList) {
    tail.setEndBefore(firstList);
  } else {
    tail.setEnd(block, block.childNodes.length);
  }
  const after = doc.createElement(block.tagName.toLowerCase());
  if (block.className) {
    after.className = block.className;
  }
  after.appendChild(tail.extractContents());

  const inserted = block.tagName === 'LI' ? toListItems(doc, nodes) : nodes;
  block.after(...inserted, after);

  if (isBlockEmpty(block) && inlineChildren(block).length === block.childNodes.length) {
    block.remove();
  }
  if (isBlockEmpty(after)) {
    after.remove();
  }

  const last = inserted.at(-1);
  return last instanceof HTMLElement
    ? lastTextPosition(last)
    : { node: root, offset: root.childNodes.length };
};
