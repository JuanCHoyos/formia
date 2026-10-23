import type {
  TextEditorAlignment,
  TextEditorBlockType,
  TextEditorListType,
} from '../../../types/text-editor';
import {
  childOf,
  closestWithin,
  ensureBreak,
  holdsContent,
  indexOf,
  inlineChildren,
  isBlockEmpty,
  isElement,
  isList,
  isolateWithin,
  isTextBlock,
  renameElement,
  textBlockOf,
  unwrap,
  wrap,
  type DomPosition,
  firstTextPosition,
} from './dom';

const BLOCK_TYPE_TAGS: Record<TextEditorBlockType, string> = {
  paragraph: 'p',
  heading1: 'h1',
  heading2: 'h2',
  heading3: 'h3',
};

const LIST_TYPE_TAGS: Record<TextEditorListType, string> = {
  bullet: 'UL',
  ordered: 'OL',
};

const ALIGN_PREFIX = 'te-align-';

const isLeafInRange = (range: Range, leaf: Node): boolean => {
  if (!range.intersectsNode(leaf)) {
    return false;
  }
  if (leaf instanceof Text) {
    const startsAtEnd = leaf === range.startContainer && range.startOffset >= leaf.length;
    const endsAtStart = leaf === range.endContainer && range.endOffset === 0;
    return leaf.length > 0 && !startsAtEnd && !endsAtStart;
  }
  return true;
};

/** Text blocks touched by the range, in document order. */
export const textBlocksIn = (root: HTMLElement, range: Range): HTMLElement[] => {
  const blocks: HTMLElement[] = [];
  const add = (block: HTMLElement | null) => {
    if (block && !blocks.includes(block)) {
      blocks.push(block);
    }
  };

  add(
    textBlockOf(range.startContainer, root) ??
      blockAtBoundary(root, range.startContainer, range.startOffset),
  );
  if (!range.collapsed) {
    const walker = root.ownerDocument.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    );
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const leaf = node instanceof Text || (isElement(node) && node.tagName === 'BR');
      if (leaf && isLeafInRange(range, node)) {
        add(textBlockOf(node, root));
      }
    }
  }

  return blocks.sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
};

/** A boundary between blocks (e.g. `(root, 2)`) resolves to the block right after it. */
const blockAtBoundary = (
  root: HTMLElement,
  container: Node,
  offset: number,
): HTMLElement | null => {
  const next = container.childNodes[offset] ?? container.childNodes[offset - 1];
  if (!next) {
    return null;
  }
  if (isTextBlock(next)) {
    return next;
  }
  if (isElement(next)) {
    return next.querySelector<HTMLElement>('p, h1, h2, h3, li');
  }
  return textBlockOf(next, root);
};

const alignmentClass = (block: HTMLElement): string | undefined => {
  return Array.from(block.classList).find((className) => className.startsWith(ALIGN_PREFIX));
};

export const alignmentOf = (block: HTMLElement): TextEditorAlignment => {
  const value = alignmentClass(block)?.slice(ALIGN_PREFIX.length);
  return value === 'center' || value === 'right' || value === 'justify' ? value : 'left';
};

export const blockTypeOf = (block: HTMLElement): TextEditorBlockType => {
  switch (block.tagName) {
    case 'H1':
      return 'heading1';
    case 'H2':
      return 'heading2';
    case 'H3':
      return 'heading3';
    default:
      return 'paragraph';
  }
};

export const listTypeOf = (block: HTMLElement): TextEditorListType | null => {
  if (block.tagName !== 'LI') {
    return null;
  }
  return block.parentElement?.tagName === 'OL' ? 'ordered' : 'bullet';
};

export const setAlignment = (
  blocks: readonly HTMLElement[],
  alignment: TextEditorAlignment,
): void => {
  for (const block of blocks) {
    const current = alignmentClass(block);
    if (current) {
      block.classList.remove(current);
    }
    if (alignment !== 'left') {
      block.classList.add(`${ALIGN_PREFIX}${alignment}`);
    }
    if (!block.classList.length) {
      block.removeAttribute('class');
    }
  }
};

/** Moves a list item one level up; a top-level item becomes a paragraph. Returns the moved block. */
export const outdentListItem = (item: HTMLElement): HTMLElement => {
  const list = item.parentElement;
  const parentItem = list?.parentElement;
  if (!list || !parentItem) {
    return item;
  }

  if (parentItem.tagName !== 'LI') {
    return liftListItem(item);
  }

  // Items after this one become its children, so the visual order stays the same.
  const following: Element[] = [];
  for (let next = item.nextElementSibling; next; next = next.nextElementSibling) {
    following.push(next);
  }
  if (following.length) {
    const nested = list.cloneNode(false);
    following.forEach((node) => nested.appendChild(node));
    item.appendChild(nested);
  }

  parentItem.after(item);
  if (!list.querySelector(':scope > li')) {
    list.remove();
  }
  return item;
};

/** Turns a top-level list item into a paragraph at the same place, splitting its list. */
const liftListItem = (item: HTMLElement): HTMLElement => {
  const list = item.parentElement;
  if (!list) {
    return item;
  }

  isolateWithin(item, item, list);
  const paragraph = item.ownerDocument.createElement('p');
  const alignment = alignmentClass(item);
  if (alignment) {
    paragraph.className = alignment;
  }
  const nested = Array.from(item.childNodes).filter(isList);
  inlineChildren(item).forEach((child) => paragraph.appendChild(child));
  list.replaceWith(paragraph, ...nested);
  ensureBreak(paragraph);
  return paragraph;
};

/** Lifts a list item, however deep, all the way out to a paragraph. */
export const liftToParagraph = (item: HTMLElement): HTMLElement => {
  let block = item;
  while (block.tagName === 'LI') {
    block = outdentListItem(block);
  }
  return block;
};

export const indentListItem = (item: HTMLElement): void => {
  const previous = item.previousElementSibling;
  const list = item.parentElement;
  if (!previous || previous.tagName !== 'LI' || !list) {
    return;
  }

  const last = previous.lastElementChild;
  const nested =
    last && last.tagName === list.tagName ? last : previous.appendChild(list.cloneNode(false));
  nested.appendChild(item);
};

export const setBlockType = (
  blocks: readonly HTMLElement[],
  blockType: TextEditorBlockType,
): void => {
  const tag = BLOCK_TYPE_TAGS[blockType];
  for (const block of blocks) {
    const target = block.tagName === 'LI' ? liftToParagraph(block) : block;
    if (target.tagName !== tag.toUpperCase()) {
      renameElement(target, tag);
    }
  }
};

export const toggleList = (
  root: HTMLElement,
  blocks: readonly HTMLElement[],
  listType: TextEditorListType,
): void => {
  const tag = LIST_TYPE_TAGS[listType];
  const allInList =
    blocks.length > 0 &&
    blocks.every((block) => block.tagName === 'LI' && block.parentElement?.tagName === tag);

  if (allInList) {
    blocks.forEach(liftToParagraph);
    return;
  }

  for (const block of blocks) {
    if (block.tagName === 'LI') {
      const list = block.parentElement;
      if (list && list.tagName !== tag) {
        renameElement(list, tag.toLowerCase());
      }
      continue;
    }
    const item = renameElement(block, 'li');
    wrap(item, root.ownerDocument.createElement(tag.toLowerCase()));
  }
};

export const toggleBlockquote = (root: HTMLElement, blocks: readonly HTMLElement[]): void => {
  if (!blocks.length) {
    return;
  }

  const isQuote = (element: HTMLElement) => element.tagName === 'BLOCKQUOTE';
  const quotes = blocks.map((block) => closestWithin(block, root, isQuote));

  if (quotes.every((quote) => quote !== null)) {
    for (const quote of new Set(quotes)) {
      if (!quote) {
        continue;
      }
      const inside = blocks.filter((block) => quote.contains(block));
      const first = childOf(inside[0], quote);
      const last = childOf(inside[inside.length - 1], quote);
      if (first && last) {
        isolateWithin(first, last, quote);
      }
      unwrap(quote);
    }
    return;
  }

  const first = childOf(blocks[0], root);
  const last = childOf(blocks[blocks.length - 1], root);
  if (!first || !last) {
    return;
  }

  const quote = root.ownerDocument.createElement('blockquote');
  root.insertBefore(quote, first);
  let node: Node | null = first;
  while (node) {
    const next: Node | null = node === last ? null : node.nextSibling;
    if (isElement(node) && isQuote(node)) {
      while (node.firstChild) {
        quote.appendChild(node.firstChild);
      }
      node.remove();
    } else {
      quote.appendChild(node);
    }
    node = next;
  }
};

/** Inserts a rule after the block holding the caret and returns the paragraph that follows it. */
export const insertHorizontalRule = (root: HTMLElement, block: HTMLElement | null): HTMLElement => {
  const doc = root.ownerDocument;
  const rule = doc.createElement('hr');

  if (block && block.tagName === 'P' && block.parentNode === root && isBlockEmpty(block)) {
    block.before(rule);
    return block;
  }

  const top = block ? childOf(block, root) : null;
  if (top instanceof Element) {
    top.after(rule);
  } else {
    root.appendChild(rule);
  }

  const next = rule.nextElementSibling;
  if (next instanceof HTMLElement && next.tagName === 'P' && isBlockEmpty(next)) {
    return next;
  }
  const paragraph = doc.createElement('p');
  paragraph.appendChild(doc.createElement('br'));
  rule.after(paragraph);
  return paragraph;
};

/**
 * Splits the block at a collapsed range (Enter). An empty list item leaves the list and an
 * empty last paragraph of a quote leaves the quote. Returns where the caret should go.
 */
export const splitBlock = (root: HTMLElement, range: Range): DomPosition | null => {
  const block = textBlockOf(range.startContainer, root);
  if (!block) {
    return null;
  }

  if (block.tagName === 'LI' && isBlockEmpty(block)) {
    return firstTextPosition(outdentListItem(block));
  }

  const quote = block.parentElement;
  if (
    block.tagName === 'P' &&
    quote?.tagName === 'BLOCKQUOTE' &&
    isBlockEmpty(block) &&
    block === quote.lastElementChild
  ) {
    quote.after(block);
    if (!quote.firstElementChild) {
      quote.remove();
    }
    return { node: block, offset: 0 };
  }

  const doc = root.ownerDocument;
  const tail = doc.createRange();
  tail.setStart(range.startContainer, range.startOffset);
  const firstList = Array.from(block.childNodes).find(isList);
  if (firstList) {
    tail.setEndBefore(firstList);
  } else {
    tail.setEnd(block, block.childNodes.length);
  }
  const fragment = tail.extractContents();

  const isHeading = /^H[1-3]$/.test(block.tagName);
  const continuesHeading = isHeading && (fragment.textContent ?? '') !== '';
  const next = doc.createElement(
    isHeading && !continuesHeading ? 'p' : block.tagName.toLowerCase(),
  );
  const alignment = alignmentClass(block);
  if (alignment) {
    next.className = alignment;
  }
  if (holdsContent(fragment)) {
    next.appendChild(fragment);
  }
  Array.from(block.childNodes)
    .filter(isList)
    .forEach((list) => next.appendChild(list));
  block.after(next);

  ensureBreak(block);
  ensureBreak(next);
  return firstTextPosition(next);
};

/** Inserts a line break (Shift+Enter) at a collapsed range and returns the caret position after it. */
export const insertLineBreak = (range: Range): DomPosition => {
  const doc = range.startContainer.ownerDocument ?? document;
  const lineBreak = doc.createElement('br');
  range.insertNode(lineBreak);

  const parent = lineBreak.parentNode;
  const after = lineBreak.nextSibling;
  const endsBlock =
    !after || (after instanceof Text && after.length === 0 && !after.nextSibling) || isList(after);
  // A trailing <br> renders no line of its own; a second one makes the new line visible.
  if (endsBlock && parent) {
    parent.insertBefore(doc.createElement('br'), after);
  }

  const next = lineBreak.nextSibling;
  if (next instanceof Text) {
    return { node: next, offset: 0 };
  }
  return parent ? { node: parent, offset: indexOf(lineBreak) + 1 } : { node: lineBreak, offset: 0 };
};

/** Whether a collapsed range sits at the very start of its text block. */
export const isAtBlockStart = (block: HTMLElement, range: Range): boolean => {
  const before = block.ownerDocument.createRange();
  before.setStart(block, 0);
  before.setEnd(range.startContainer, range.startOffset);
  const fragment = before.cloneContents();
  return (fragment.textContent ?? '') === '' && !fragment.querySelector('br');
};

/** Deletes the selected content; when it spans blocks, the last block is merged into the first. */
export const deleteSelection = (root: HTMLElement, range: Range): void => {
  if (range.collapsed) {
    return;
  }
  const startBlock = textBlockOf(range.startContainer, root);
  const endBlock = textBlockOf(range.endContainer, root);
  range.deleteContents();

  if (
    startBlock &&
    endBlock &&
    startBlock !== endBlock &&
    endBlock.isConnected &&
    startBlock.isConnected
  ) {
    Array.from(endBlock.childNodes).forEach((child) => startBlock.appendChild(child));
    endBlock.remove();
  }
  range.collapse(true);
};
