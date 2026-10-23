/** Blocks that hold inline content directly. */
export const TEXT_BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'LI']);

export const LIST_TAGS = new Set(['UL', 'OL']);

export const BLOCK_TAGS = new Set([...TEXT_BLOCK_TAGS, ...LIST_TAGS, 'BLOCKQUOTE', 'HR']);

const INLINE_FORMAT_TAGS = new Set(['STRONG', 'EM', 'U', 'S', 'CODE', 'SUP', 'SUB', 'A', 'SPAN']);

export const isElement = (node: Node | null | undefined): node is HTMLElement => {
  return node instanceof HTMLElement;
};

export const isTextBlock = (node: Node | null | undefined): node is HTMLElement => {
  return isElement(node) && TEXT_BLOCK_TAGS.has(node.tagName);
};

export const isList = (node: Node | null | undefined): node is HTMLElement => {
  return isElement(node) && LIST_TAGS.has(node.tagName);
};

export const isBlock = (node: Node | null | undefined): node is HTMLElement => {
  return isElement(node) && BLOCK_TAGS.has(node.tagName);
};

/** The nearest ancestor-or-self of `node` inside `root` (exclusive) that matches. */
export const closestWithin = (
  node: Node,
  root: HTMLElement,
  matches: (element: HTMLElement) => boolean,
): HTMLElement | null => {
  let current: Node | null = node;
  while (current && current !== root) {
    if (isElement(current) && matches(current)) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
};

export const textBlockOf = (node: Node, root: HTMLElement): HTMLElement | null => {
  return closestWithin(node, root, (element) => TEXT_BLOCK_TAGS.has(element.tagName));
};

/** The ancestor-or-self of `node` that is a direct child of `container`. */
export const childOf = (node: Node, container: Node): Node | null => {
  let current: Node | null = node;
  while (current && current.parentNode !== container) {
    current = current.parentNode;
  }
  return current;
};

export const indexOf = (node: Node): number => {
  return node.parentNode ? Array.prototype.indexOf.call(node.parentNode.childNodes, node) : -1;
};

export const unwrap = (element: Element): void => {
  const parent = element.parentNode;
  if (!parent) {
    return;
  }
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
};

export const wrap = <T extends Element>(node: Node, wrapper: T): T => {
  node.parentNode?.insertBefore(wrapper, node);
  wrapper.appendChild(node);
  return wrapper;
};

/** Replaces `element` with a new element of `tag`, keeping its attributes and children. */
export const renameElement = (element: HTMLElement, tag: string): HTMLElement => {
  const renamed = element.ownerDocument.createElement(tag);
  for (const attribute of Array.from(element.attributes)) {
    renamed.setAttribute(attribute.name, attribute.value);
  }
  while (element.firstChild) {
    renamed.appendChild(element.firstChild);
  }
  element.replaceWith(renamed);
  return renamed;
};

/** Whether a node holds anything worth keeping: text, line breaks, rules or selection markers. */
export const holdsContent = (node: Node): boolean => {
  if (node instanceof Text) {
    return node.length > 0;
  }
  if (node instanceof Comment) {
    return true;
  }
  if (isElement(node) && (node.tagName === 'BR' || node.tagName === 'HR')) {
    return true;
  }
  return Array.from(node.childNodes).some(holdsContent);
};

/**
 * Splits `ancestor` so that the nodes from `first` to `last` (descendants of it) end up alone in
 * it; the content before and after moves into shallow copies placed beside it.
 */
export const isolateWithin = (first: Node, last: Node, ancestor: Element): void => {
  const doc = ancestor.ownerDocument;

  const before = doc.createRange();
  before.setStart(ancestor, 0);
  before.setEndBefore(first);
  if (!before.collapsed) {
    const fragment = before.extractContents();
    if (holdsContent(fragment)) {
      const copy = ancestor.cloneNode(false);
      copy.appendChild(fragment);
      ancestor.before(copy);
    }
  }

  const after = doc.createRange();
  after.setStartAfter(last);
  after.setEnd(ancestor, ancestor.childNodes.length);
  if (!after.collapsed) {
    const fragment = after.extractContents();
    if (holdsContent(fragment)) {
      const copy = ancestor.cloneNode(false);
      copy.appendChild(fragment);
      ancestor.after(copy);
    }
  }
};

/** Own inline content of a text block, without the lists nested in a list item. */
export const inlineChildren = (block: HTMLElement): Node[] => {
  return Array.from(block.childNodes).filter((child) => !isList(child));
};

export const isBlockEmpty = (block: HTMLElement): boolean => {
  return inlineChildren(block).every((child) => (child.textContent ?? '') === '');
};

export interface DomPosition {
  node: Node;
  offset: number;
}

export const firstTextPosition = (block: HTMLElement): DomPosition => {
  const walker = block.ownerDocument.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const text = walker.nextNode();
  return text ? { node: text, offset: 0 } : { node: block, offset: 0 };
};

export const lastTextPosition = (block: HTMLElement): DomPosition => {
  const walker = block.ownerDocument.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  let last: Node | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    last = node;
  }
  return last instanceof Text ? { node: last, offset: last.length } : { node: block, offset: 0 };
};

const sameFormat = (a: Element, b: Element): boolean => {
  return (
    a.tagName === b.tagName &&
    a.className === b.className &&
    a.getAttribute('href') === b.getAttribute('href')
  );
};

const mergeAdjacentFormats = (parent: Node): void => {
  let child = parent.firstChild;
  while (child) {
    const next = child.nextSibling;
    if (
      isElement(child) &&
      isElement(next) &&
      INLINE_FORMAT_TAGS.has(child.tagName) &&
      sameFormat(child, next)
    ) {
      while (next.firstChild) {
        child.appendChild(next.firstChild);
      }
      next.remove();
      continue;
    }
    if (isElement(child)) {
      mergeAdjacentFormats(child);
    }
    child = child.nextSibling;
  }
};

/** Removes empty inline formats, merges equal neighbours and joins adjacent text nodes. */
export const normalizeInline = (root: HTMLElement): void => {
  const formats = Array.from(
    root.querySelectorAll<HTMLElement>('strong, em, u, s, code, sup, sub, a, span'),
  );
  for (const format of formats.reverse()) {
    if (!holdsContent(format)) {
      format.remove();
    }
  }
  root.normalize();
  mergeAdjacentFormats(root);
  root.normalize();
};

/** Merges neighbouring lists of the same type and drops lists left without items. */
export const normalizeLists = (root: HTMLElement): void => {
  for (const list of Array.from(root.querySelectorAll<HTMLElement>('ul, ol'))) {
    if (!list.isConnected) {
      continue;
    }
    if (!list.querySelector(':scope > li')) {
      list.remove();
      continue;
    }
    let next = list.nextElementSibling;
    while (next && next.tagName === list.tagName) {
      while (next.firstChild) {
        list.appendChild(next.firstChild);
      }
      const merged: Element = next;
      next = next.nextElementSibling;
      merged.remove();
    }
  }
};

const wrapInlineRuns = (container: HTMLElement): void => {
  const doc = container.ownerDocument;
  let paragraph: HTMLElement | null = null;

  for (const child of Array.from(container.childNodes)) {
    if (isElement(child) && child.tagName === 'DIV') {
      paragraph = null;
      const renamed = renameElement(child, 'p');
      wrapInlineRuns(renamed);
      continue;
    }

    if (isBlock(child)) {
      paragraph = null;
      continue;
    }

    const ignorable =
      child instanceof Comment || (child instanceof Text && child.data.trim() === '');
    if (!paragraph && ignorable) {
      continue;
    }
    if (!paragraph) {
      paragraph = doc.createElement('p');
      container.insertBefore(paragraph, child);
    }
    paragraph.appendChild(child);
  }
};

/**
 * Keeps the editable tree valid after native edits: blocks at the top level, items in lists,
 * no empty containers, a line break in empty blocks and a paragraph after a trailing rule.
 */
export const ensureStructure = (root: HTMLElement): void => {
  const doc = root.ownerDocument;

  for (const div of Array.from(root.querySelectorAll('div'))) {
    if (div.parentElement === root || div.parentElement?.tagName === 'BLOCKQUOTE') {
      continue;
    }
    unwrap(div);
  }

  wrapInlineRuns(root);
  for (const quote of Array.from(root.querySelectorAll<HTMLElement>('blockquote'))) {
    wrapInlineRuns(quote);
    if (!quote.querySelector('p, h1, h2, h3, ul, ol, hr')) {
      quote.remove();
    }
  }

  for (const list of Array.from(root.querySelectorAll<HTMLElement>('ul, ol'))) {
    for (const child of Array.from(list.childNodes)) {
      if (isElement(child) && child.tagName === 'LI') {
        continue;
      }
      if (isList(child) && child.previousElementSibling?.tagName === 'LI') {
        child.previousElementSibling.appendChild(child);
      } else if (child instanceof Text && child.data.trim() === '') {
        child.remove();
      } else if (!(child instanceof Comment)) {
        wrap(child, doc.createElement('li'));
      }
    }
  }
  normalizeLists(root);

  for (const block of Array.from(root.querySelectorAll<HTMLElement>('p, h1, h2, h3, li'))) {
    ensureBreak(block);
  }

  const last = root.lastElementChild;
  if (!last || last.tagName === 'HR') {
    const paragraph = doc.createElement('p');
    paragraph.appendChild(doc.createElement('br'));
    root.appendChild(paragraph);
  }
};

/** An empty text block needs a `<br>` to have height and accept the caret. */
export const ensureBreak = (block: HTMLElement): void => {
  const inline = inlineChildren(block);
  const hasText = inline.some((child) => (child.textContent ?? '') !== '');
  const hasBreak = inline.some(
    (child) => isElement(child) && (child.tagName === 'BR' || child.querySelector('br')),
  );
  if (!hasText && !hasBreak) {
    const firstList = Array.from(block.childNodes).find(isList) ?? null;
    block.insertBefore(block.ownerDocument.createElement('br'), firstList);
  }
};
