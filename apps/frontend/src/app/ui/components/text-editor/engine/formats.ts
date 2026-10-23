import { BRAND_NAMES } from '../../../../core/theme/brand';
import type { BrandName } from '../../../../core/theme/types/brand';
import type { TextEditorMark } from '../../../types/text-editor';
import { closestWithin, isolateWithin, unwrap, wrap } from './dom';

export const MARK_TAGS: Record<TextEditorMark, string> = {
  bold: 'STRONG',
  italic: 'EM',
  underline: 'U',
  strike: 'S',
  code: 'CODE',
  superscript: 'SUP',
  subscript: 'SUB',
};

/** Marks that cannot be combined with each other. */
const EXCLUSIVE_MARKS: Partial<Record<TextEditorMark, TextEditorMark>> = {
  superscript: 'subscript',
  subscript: 'superscript',
};

export type ColorFamily = 'backgroundColor' | 'textColor';

export type InlineFormat =
  | { kind: 'link'; href: string }
  | { kind: 'mark'; mark: TextEditorMark }
  | { kind: ColorFamily; color: BrandName };

/** A family groups formats that replace each other: one text color, one link, each mark on its own. */
type FormatFamily = 'link' | ColorFamily | TextEditorMark;

const FAMILIES: readonly FormatFamily[] = [
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'superscript',
  'subscript',
  'textColor',
  'backgroundColor',
  'link',
];

/** Colors are stored as brand classes, e.g. `te-color-teal`, styled from the theme's brands. */
const COLOR_PREFIXES: Record<ColorFamily, string> = {
  textColor: 'te-color-',
  backgroundColor: 'te-bg-',
};

const familyOf = (format: InlineFormat): FormatFamily =>
  format.kind === 'mark' ? format.mark : format.kind;

const isBrandName = (value: string): value is BrandName =>
  BRAND_NAMES.some((brand) => brand === value);

const matcher = (family: FormatFamily): ((element: HTMLElement) => boolean) => {
  switch (family) {
    case 'textColor':
    case 'backgroundColor':
      return (element) =>
        element.tagName === 'SPAN' && element.className.startsWith(COLOR_PREFIXES[family]);
    case 'link':
      return (element) => element.tagName === 'A';
    default: {
      const tag = MARK_TAGS[family];
      return (element) => element.tagName === tag;
    }
  }
};

const createFormat = (doc: Document, format: InlineFormat): HTMLElement => {
  switch (format.kind) {
    case 'mark':
      return doc.createElement(MARK_TAGS[format.mark].toLowerCase());
    case 'link': {
      const link = doc.createElement('a');
      link.setAttribute('href', format.href);
      link.setAttribute('rel', 'noopener noreferrer');
      link.setAttribute('target', '_blank');
      return link;
    }
    default: {
      const span = doc.createElement('span');
      span.className = `${COLOR_PREFIXES[format.kind]}${format.color}`;
      return span;
    }
  }
};

const readFormat = (family: FormatFamily, element: HTMLElement): InlineFormat | null => {
  switch (family) {
    case 'textColor':
    case 'backgroundColor': {
      const color = element.className.slice(COLOR_PREFIXES[family].length);
      return isBrandName(color) ? { kind: family, color } : null;
    }
    case 'link':
      return { kind: 'link', href: element.getAttribute('href') ?? '' };
    default:
      return { kind: 'mark', mark: family };
  }
};

const sameFormat = (a: InlineFormat, b: InlineFormat): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

/** Text nodes with at least one selected character. */
export const textNodesIn = (root: HTMLElement, range: Range): Text[] => {
  const result: Text[] = [];
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!(node instanceof Text) || node.length === 0 || !range.intersectsNode(node)) {
      continue;
    }
    const startsAtEnd = node === range.startContainer && range.startOffset >= node.length;
    const endsAtStart = node === range.endContainer && range.endOffset === 0;
    if (!startsAtEnd && !endsAtStart) {
      result.push(node);
    }
  }
  return result;
};

/** Splits text nodes at the range edges so the selection covers whole text nodes. */
export const splitAtRangeEdges = (range: Range): void => {
  const { endContainer, endOffset } = range;
  if (endContainer instanceof Text && endOffset > 0 && endOffset < endContainer.length) {
    endContainer.splitText(endOffset);
    range.setEnd(endContainer, endOffset);
  }
  const { startContainer, startOffset } = range;
  if (startContainer instanceof Text && startOffset > 0 && startOffset < startContainer.length) {
    const tail = startContainer.splitText(startOffset);
    const endsInSameNode = range.endContainer === startContainer;
    const end = endsInSameNode ? range.endOffset - startOffset : null;
    range.setStart(tail, 0);
    if (end !== null) {
      range.setEnd(tail, end);
    }
  }
};

const removeFamily = (text: Text, root: HTMLElement, family: FormatFamily): void => {
  const matches = matcher(family);
  for (
    let format = closestWithin(text, root, matches);
    format;
    format = closestWithin(text, root, matches)
  ) {
    isolateWithin(text, text, format);
    unwrap(format);
  }
};

const applyFormat = (text: Text, root: HTMLElement, format: InlineFormat): void => {
  const family = familyOf(format);
  const current = closestWithin(text, root, matcher(family));
  if (current) {
    const existing = readFormat(family, current);
    if (existing && sameFormat(existing, format)) {
      return;
    }
    removeFamily(text, root, family);
  }
  wrap(text, createFormat(root.ownerDocument, format));
};

/** Formats active at a collapsed position, read from its ancestors. */
export const formatsAt = (root: HTMLElement, node: Node): InlineFormat[] => {
  const formats: InlineFormat[] = [];
  for (const family of FAMILIES) {
    const element = closestWithin(node, root, matcher(family));
    const format = element ? readFormat(family, element) : null;
    if (format) {
      formats.push(format);
    }
  }
  return formats;
};

/** Whether every selected character (or the caret position) has the format family. */
export const hasFamilyEverywhere = (
  root: HTMLElement,
  range: Range,
  family: FormatFamily,
): boolean => {
  const matches = matcher(family);
  if (range.collapsed) {
    return closestWithin(range.startContainer, root, matches) !== null;
  }
  const texts = textNodesIn(root, range);
  return texts.length > 0 && texts.every((text) => closestWithin(text, root, matches) !== null);
};

/** The single format of a family shared by the whole selection, if any. */
export const commonFormat = (
  root: HTMLElement,
  range: Range,
  family: FormatFamily,
): InlineFormat | null => {
  const matches = matcher(family);
  const nodes: Node[] = range.collapsed ? [range.startContainer] : textNodesIn(root, range);
  let common: InlineFormat | null = null;
  for (const node of nodes) {
    const element = closestWithin(node, root, matches);
    const format = element ? readFormat(family, element) : null;
    if (!format || (common && !sameFormat(common, format))) {
      return null;
    }
    common = format;
  }
  return common;
};

export const toggleMark = (root: HTMLElement, range: Range, mark: TextEditorMark): void => {
  splitAtRangeEdges(range);
  const texts = textNodesIn(root, range);
  const active =
    texts.length > 0 && texts.every((text) => closestWithin(text, root, matcher(mark)) !== null);
  const exclusive = EXCLUSIVE_MARKS[mark];

  for (const text of texts) {
    if (active) {
      removeFamily(text, root, mark);
    } else {
      if (exclusive) {
        removeFamily(text, root, exclusive);
      }
      applyFormat(text, root, { kind: 'mark', mark });
    }
  }
};

/** Applies a format to every selected character, or removes its whole family when `format` is null. */
export const setFamily = (
  root: HTMLElement,
  range: Range,
  family: 'link' | ColorFamily,
  format: InlineFormat | null,
): void => {
  splitAtRangeEdges(range);
  for (const text of textNodesIn(root, range)) {
    if (format) {
      applyFormat(text, root, format);
    } else {
      removeFamily(text, root, family);
    }
  }
};

/** Removes marks and colors from the selection; links stay. */
export const clearFormatting = (root: HTMLElement, range: Range): void => {
  splitAtRangeEdges(range);
  for (const text of textNodesIn(root, range)) {
    for (const family of FAMILIES) {
      if (family !== 'link') {
        removeFamily(text, root, family);
      }
    }
  }
};

/** Inserts text at a collapsed range with exactly `formats`, splitting out of formats it should not have. */
export const insertFormattedText = (
  root: HTMLElement,
  range: Range,
  value: string,
  formats: readonly InlineFormat[],
): Text => {
  const text = root.ownerDocument.createTextNode(value);
  range.insertNode(text);

  for (const family of FAMILIES) {
    const desired = formats.find((format) => familyOf(format) === family);
    const element = closestWithin(text, root, matcher(family));
    const current = element ? readFormat(family, element) : null;

    if (current && (!desired || !sameFormat(current, desired))) {
      removeFamily(text, root, family);
    }
    if (desired && (!current || !sameFormat(current, desired))) {
      wrap(text, createFormat(root.ownerDocument, desired));
    }
  }

  return text;
};

export const toggleFormatIn = (
  formats: readonly InlineFormat[],
  mark: TextEditorMark,
): InlineFormat[] => {
  const has = formats.some((format) => format.kind === 'mark' && format.mark === mark);
  const exclusive = EXCLUSIVE_MARKS[mark];
  const rest = formats.filter(
    (format) => !(format.kind === 'mark' && (format.mark === mark || format.mark === exclusive)),
  );
  return has ? rest : [...rest, { kind: 'mark', mark }];
};

export const replaceFamilyIn = (
  formats: readonly InlineFormat[],
  family: ColorFamily,
  format: InlineFormat | null,
): InlineFormat[] => {
  const rest = formats.filter((item) => familyOf(item) !== family);
  return format ? [...rest, format] : rest;
};
