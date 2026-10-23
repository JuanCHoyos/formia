import { BRAND_NAMES } from '../../core/theme/brand';
import type { TextEditorTool } from '../types/text-editor';

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/** Text and highlight colors are the theme brands, so a new brand is allowed as soon as it exists. */
const TEXT_COLOR_CLASSES = new Set(BRAND_NAMES.map((brand) => `te-color-${brand}`));
const BACKGROUND_COLOR_CLASSES = new Set(BRAND_NAMES.map((brand) => `te-bg-${brand}`));
const ALIGN_CLASS = /^te-align-(center|right|justify)$/;

/** Elements removed together with everything inside them. */
const DROPPED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'TEMPLATE',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'NOSCRIPT',
  'HEAD',
  'TITLE',
  'META',
  'LINK',
  'SVG',
  'MATH',
  'TEXTAREA',
  'SELECT',
  'BUTTON',
  'INPUT',
  'IMG',
  'VIDEO',
  'AUDIO',
  'CANVAS',
]);

const MARK_TAGS: Record<string, { tag: string; tool: TextEditorTool } | undefined> = {
  STRONG: { tag: 'strong', tool: 'bold' },
  B: { tag: 'strong', tool: 'bold' },
  EM: { tag: 'em', tool: 'italic' },
  I: { tag: 'em', tool: 'italic' },
  U: { tag: 'u', tool: 'underline' },
  INS: { tag: 'u', tool: 'underline' },
  S: { tag: 's', tool: 'strike' },
  STRIKE: { tag: 's', tool: 'strike' },
  DEL: { tag: 's', tool: 'strike' },
  CODE: { tag: 'code', tool: 'code' },
  KBD: { tag: 'code', tool: 'code' },
  SUP: { tag: 'sup', tool: 'superscript' },
  SUB: { tag: 'sub', tool: 'subscript' },
};

const HEADING_TAGS: Record<string, string | undefined> = {
  H1: 'h1',
  H2: 'h2',
  H3: 'h3',
  H4: 'h3',
  H5: 'h3',
  H6: 'h3',
};

const TEXT_BLOCK_TAGS = new Set(['P', 'PRE', 'DT', 'DD', 'FIGCAPTION', 'CAPTION']);

/** Elements whose children are laid out as blocks; their inline runs become paragraphs. */
const CONTAINER_TAGS = new Set([
  'DIV',
  'SECTION',
  'ARTICLE',
  'HEADER',
  'FOOTER',
  'MAIN',
  'ASIDE',
  'NAV',
  'FIGURE',
  'CENTER',
  'FORM',
  'BODY',
  'DL',
  'TABLE',
  'THEAD',
  'TBODY',
  'TFOOT',
  'TR',
  'TD',
  'TH',
]);

const LIST_TAGS = new Set(['UL', 'OL']);

let parserDocument: Document | null = null;

/** An inert document: nothing parsed into it loads resources or runs scripts. */
const inertDocument = (): Document => {
  parserDocument ??= document.implementation.createHTMLDocument('');
  return parserDocument;
};

const parse = (html: string): DocumentFragment => {
  const template = inertDocument().createElement('template');
  template.innerHTML = html;
  return template.content;
};

export const isSafeHref = (href: string | null | undefined): href is string => {
  if (!href) {
    return false;
  }

  try {
    return SAFE_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
};

/** Turns what a person typed as a link into a safe absolute URL, or `null` when it is not one. */
export const normalizeUrl = (input: string): string | null => {
  const value = input.trim();
  if (!value || /\s/.test(value)) {
    return null;
  }

  if (/^mailto:/i.test(value)) {
    return /^mailto:[^@]+@[^@]+\.[^@]+$/i.test(value) ? value : null;
  }

  if (/^[^@/:]+@[^@/]+\.[^@/]+$/.test(value)) {
    return `mailto:${value}`;
  }

  const candidate = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    const validHost = url.hostname === 'localhost' || /\.[a-z]{2,}$/i.test(url.hostname);
    return (url.protocol === 'http:' || url.protocol === 'https:') && validHost ? candidate : null;
  } catch {
    return null;
  }
};

/** Number of visible characters, ignoring markup. */
export const richTextLength = (html: string | null | undefined): number => {
  return html ? (parse(html).textContent ?? '').length : 0;
};

/**
 * Rebuilds rich text from an allowlist of tags, attributes and `te-*` classes. Anything else is
 * dropped or unwrapped, so the result is safe to render and has a single canonical shape. When
 * `tools` is given, formats whose tool is not in it are removed too (used when pasting).
 */
export const sanitizeRichText = (
  html: string | null | undefined,
  tools?: ReadonlySet<TextEditorTool>,
): string => {
  if (!html) {
    return '';
  }

  const output = inertDocument().createElement('div');
  new RichTextSanitizer(output.ownerDocument, tools).blocks(
    Array.from(parse(html).childNodes),
    output,
  );
  trimTrailingEmptyBlocks(output);

  const hasContent = output.textContent !== '' || output.querySelector('hr') !== null;
  return hasContent ? output.innerHTML : '';
};

const trimTrailingEmptyBlocks = (output: HTMLElement): void => {
  let last = output.lastElementChild;
  while (last && last.tagName === 'P' && last.childNodes.length === 0) {
    last.remove();
    last = output.lastElementChild;
  }
};

const hasContent = (element: Element): boolean => {
  return element.textContent !== '' || element.querySelector('br') !== null;
};

/** Drops a trailing `<br>` that only exists so browsers can place the caret on an empty line. */
const trimTrailingBreak = (block: Element): void => {
  const last = block.lastChild;
  if (last instanceof Element && last.tagName === 'BR') {
    last.remove();
  }
};

class RichTextSanitizer {
  constructor(
    private readonly doc: Document,
    private readonly tools?: ReadonlySet<TextEditorTool>,
  ) {}

  private allows(tool: TextEditorTool): boolean {
    return !this.tools || this.tools.has(tool);
  }

  blocks(nodes: readonly Node[], parent: Element): void {
    let paragraph: HTMLElement | null = null;
    const flush = () => {
      if (paragraph) {
        this.appendTextBlock(paragraph, parent);
        paragraph = null;
      }
    };

    for (const node of nodes) {
      if (node instanceof Element && this.isBlock(node)) {
        flush();
        this.block(node, parent);
      } else if (!(node instanceof Text && paragraph === null && node.data.trim() === '')) {
        paragraph ??= this.doc.createElement('p');
        this.inline(node, paragraph, false);
      }
    }

    flush();
  }

  private isBlock(element: Element): boolean {
    const tag = element.tagName;
    return (
      TEXT_BLOCK_TAGS.has(tag) ||
      CONTAINER_TAGS.has(tag) ||
      LIST_TAGS.has(tag) ||
      HEADING_TAGS[tag] !== undefined ||
      tag === 'BLOCKQUOTE' ||
      tag === 'HR' ||
      tag === 'LI'
    );
  }

  private block(element: Element, parent: Element): void {
    const tag = element.tagName;

    if (DROPPED_TAGS.has(tag)) {
      return;
    }

    if (CONTAINER_TAGS.has(tag)) {
      this.blocks(Array.from(element.childNodes), parent);
    } else if (LIST_TAGS.has(tag)) {
      this.list(element, parent);
    } else if (tag === 'BLOCKQUOTE') {
      this.blockquote(element, parent);
    } else if (tag === 'HR') {
      if (this.allows('horizontalRule')) {
        parent.append(this.doc.createElement('hr'));
      }
    } else {
      const heading = HEADING_TAGS[tag];
      const textBlock = this.doc.createElement(heading && this.allows('heading') ? heading : 'p');
      this.copyAlignment(element, textBlock);
      this.inlineChildren(element, textBlock, false);
      this.appendTextBlock(textBlock, parent);
    }
  }

  private appendTextBlock(block: HTMLElement, parent: Element): void {
    trimTrailingBreak(block);
    parent.append(block);
  }

  private blockquote(element: Element, parent: Element): void {
    if (!this.allows('blockquote')) {
      this.blocks(Array.from(element.childNodes), parent);
      return;
    }

    const quote = this.doc.createElement('blockquote');
    this.blocks(Array.from(element.childNodes), quote);
    if (quote.childNodes.length) {
      parent.append(quote);
    }
  }

  private list(element: Element, parent: Element): void {
    const tag = element.tagName === 'OL' ? 'ol' : 'ul';
    if (!this.allows(tag === 'ol' ? 'orderedList' : 'bulletList')) {
      this.listAsParagraphs(element, parent);
      return;
    }

    const list = this.doc.createElement(tag);
    for (const child of Array.from(element.childNodes)) {
      if (child instanceof Element && LIST_TAGS.has(child.tagName)) {
        // Lists nested directly in a list (invalid but common in pasted HTML) belong to the item above.
        const previous = list.lastElementChild;
        if (previous) {
          this.list(child, previous);
        } else {
          this.list(child, parent);
        }
      } else if (child instanceof Element && child.tagName === 'LI') {
        list.append(this.listItem(child));
      } else if (
        !(child instanceof Text && child.data.trim() === '') &&
        !(child instanceof Comment)
      ) {
        const item = this.doc.createElement('li');
        this.inline(child, item, false);
        if (hasContent(item)) {
          list.append(item);
        }
      }
    }

    if (list.childNodes.length) {
      parent.append(list);
    }
  }

  private listItem(element: Element): HTMLElement {
    const item = this.doc.createElement('li');
    this.copyAlignment(element, item);
    const nested: Element[] = [];

    for (const child of Array.from(element.childNodes)) {
      if (child instanceof Element && LIST_TAGS.has(child.tagName)) {
        nested.push(child);
      } else if (child instanceof Element && this.isBlock(child)) {
        // ProseMirror-style `<li><p>…</p></li>`: keep each paragraph on its own line.
        if (hasContent(item)) {
          item.append(this.doc.createElement('br'));
        }
        this.copyAlignment(child, item);
        this.inlineChildren(child, item, false);
      } else {
        this.inline(child, item, false);
      }
    }

    trimTrailingBreak(item);
    for (const list of nested) {
      this.list(list, item);
    }

    return item;
  }

  private listAsParagraphs(element: Element, parent: Element): void {
    for (const child of Array.from(element.childNodes)) {
      if (!(child instanceof Element)) {
        continue;
      }

      if (LIST_TAGS.has(child.tagName)) {
        this.listAsParagraphs(child, parent);
        continue;
      }

      const paragraph = this.doc.createElement('p');
      this.copyAlignment(child, paragraph);
      const nested: Element[] = [];
      for (const node of Array.from(child.childNodes)) {
        if (node instanceof Element && LIST_TAGS.has(node.tagName)) {
          nested.push(node);
        } else {
          this.inline(node, paragraph, false);
        }
      }
      this.appendTextBlock(paragraph, parent);
      nested.forEach((list) => this.listAsParagraphs(list, parent));
    }
  }

  private inlineChildren(source: Node, target: Element, insideLink: boolean): void {
    for (const child of Array.from(source.childNodes)) {
      this.inline(child, target, insideLink);
    }
  }

  private inline(node: Node, target: Element, insideLink: boolean): void {
    if (node instanceof Text) {
      target.append(node.data.replace(/\s*[\r\n]+\s*/g, ' '));
      return;
    }

    if (!(node instanceof Element) || DROPPED_TAGS.has(node.tagName)) {
      return;
    }

    if (node.tagName === 'BR') {
      target.append(this.doc.createElement('br'));
      return;
    }

    if (node.tagName === 'A') {
      const href = node.getAttribute('href');
      if (!insideLink && this.allows('link') && isSafeHref(href)) {
        const link = this.doc.createElement('a');
        link.setAttribute('href', href);
        link.setAttribute('rel', 'noopener noreferrer');
        link.setAttribute('target', '_blank');
        this.appendWrapped(link, node, target, true);
      } else {
        this.inlineChildren(node, target, insideLink);
      }
      return;
    }

    const wrappers = this.wrappersFor(node);
    if (!wrappers.length) {
      this.inlineChildren(node, target, insideLink);
      return;
    }

    // Nest the wrappers (outermost first) and fill the innermost one.
    const outer = wrappers[0];
    const inner = wrappers.reduce((parent, wrapper) => {
      if (wrapper !== parent) {
        parent.append(wrapper);
      }
      return wrapper;
    });
    this.inlineChildren(node, inner, insideLink);
    if (hasContent(outer)) {
      target.append(outer);
    }
  }

  private appendWrapped(
    wrapper: Element,
    source: Element,
    target: Element,
    insideLink: boolean,
  ): void {
    this.inlineChildren(source, wrapper, insideLink);
    if (hasContent(wrapper)) {
      target.append(wrapper);
    }
  }

  /** The canonical elements an inline element maps to, from its tag, `te-*` classes and inline styles. */
  private wrappersFor(element: Element): HTMLElement[] {
    const wrappers: HTMLElement[] = [];
    const add = (tag: string, tool: TextEditorTool, className?: string) => {
      if (
        this.allows(tool) &&
        !wrappers.some((w) => w.tagName === tag.toUpperCase() && !className)
      ) {
        const wrapper = this.doc.createElement(tag);
        if (className) {
          wrapper.className = className;
        }
        wrappers.push(wrapper);
      }
    };

    const style = element instanceof HTMLElement ? element.style : null;
    const fontWeight = style?.fontWeight ?? '';
    const explicitlyNormal = fontWeight === 'normal' || fontWeight === '400';

    const mark = MARK_TAGS[element.tagName];
    if (mark && !(mark.tool === 'bold' && explicitlyNormal)) {
      add(mark.tag, mark.tool);
    }

    if (style) {
      if (fontWeight === 'bold' || Number(fontWeight) >= 600) {
        add('strong', 'bold');
      }
      if (style.fontStyle === 'italic') {
        add('em', 'italic');
      }
      const decoration = `${style.textDecoration} ${style.textDecorationLine}`;
      if (decoration.includes('underline')) {
        add('u', 'underline');
      }
      if (decoration.includes('line-through')) {
        add('s', 'strike');
      }
      if (style.verticalAlign === 'super') {
        add('sup', 'superscript');
      }
      if (style.verticalAlign === 'sub') {
        add('sub', 'subscript');
      }
    }

    for (const className of Array.from(element.classList)) {
      if (TEXT_COLOR_CLASSES.has(className)) {
        add('span', 'textColor', className);
      } else if (BACKGROUND_COLOR_CLASSES.has(className)) {
        add('span', 'backgroundColor', className);
      }
    }

    return wrappers;
  }

  private copyAlignment(source: Element, target: Element): void {
    if (!this.allows('align')) {
      return;
    }

    const fromClass = Array.from(source.classList).find((className) => ALIGN_CLASS.test(className));
    const style = source instanceof HTMLElement ? source.style.textAlign : '';
    const fromStyle =
      style === 'center' || style === 'justify'
        ? `te-align-${style}`
        : style === 'right' || style === 'end'
          ? 'te-align-right'
          : null;
    const alignment = fromClass ?? fromStyle;

    if (alignment) {
      target.className = alignment;
    }
  }
}
