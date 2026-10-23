import type {
  TextEditorCommand,
  TextEditorMark,
  TextEditorState,
  TextEditorTool,
} from '../../../types/text-editor';
import { normalizeUrl, sanitizeRichText } from '../../../utils/rich-text.utils';
import { EMPTY_TEXT_EDITOR_STATE, HISTORY_LIMIT, TYPING_GROUP_MS } from '../text-editor.constants';
import {
  alignmentOf,
  blockTypeOf,
  deleteSelection,
  indentListItem,
  insertHorizontalRule,
  insertLineBreak,
  isAtBlockStart,
  listTypeOf,
  outdentListItem,
  setAlignment,
  setBlockType,
  splitBlock,
  textBlocksIn,
  toggleBlockquote,
  toggleList,
} from './blocks';
import {
  BLOCK_TAGS,
  closestWithin,
  ensureBreak,
  ensureStructure,
  firstTextPosition,
  indexOf,
  isElement,
  normalizeInline,
  normalizeLists,
  renameElement,
  textBlockOf,
  unwrap,
  wrap,
  type DomPosition,
} from './dom';
import {
  clearFormatting,
  commonFormat,
  formatsAt,
  hasFamilyEverywhere,
  insertFormattedText,
  MARK_TAGS,
  replaceFamilyIn,
  setFamily,
  toggleFormatIn,
  toggleMark,
  type InlineFormat,
} from './formats';
import { EditorHistory, type EditorSnapshot } from './history';
import { insertHtml, plainTextToHtml } from './paste';
import {
  caretAt,
  editorRange,
  offsetOf,
  restoreSelection,
  saveSelection,
  selectRange,
  withMarkers,
} from './selection';
import { keyActionFor, matchAutolink, matchBlockShortcut, matchInlineShortcut } from './shortcuts';

const MARKS: readonly TextEditorMark[] = [
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'superscript',
  'subscript',
];

const WHITESPACE = /^[\s\u00a0]$/;
const URL_LIKE = /^(?:https?:\/\/|www\.|mailto:)\S+$/i;

/** What a key press did: changed the content, only changed the toolbar state, or asks for the link popover. */
export type KeydownResult = 'changed' | 'link' | 'state' | null;

interface StoredFormats {
  formats: InlineFormat[];
  at: Range;
}

const sameRange = (a: Range, b: Range): boolean => {
  return (
    a.startContainer === b.startContainer &&
    a.startOffset === b.startOffset &&
    a.endContainer === b.endContainer &&
    a.endOffset === b.endOffset
  );
};

/**
 * Editing behaviour for a `contenteditable` root: commands, keyboard and input handling, paste,
 * Markdown-like shortcuts and undo history. It knows nothing about Angular; the component feeds
 * it DOM events and reads back the content and toolbar state.
 */
export class TextEditorEngine {
  private readonly history = new EditorHistory(HISTORY_LIMIT);
  /** Formats chosen with a collapsed caret; they apply to the next typed text. */
  private storedFormats: StoredFormats | null = null;
  /** Selection kept while focus is elsewhere (toolbar, popovers). */
  private lastRange: Range | null = null;
  private lastTypingAt = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly root: HTMLElement,
    private readonly tools: () => ReadonlySet<TextEditorTool>,
  ) {}

  private allows(tool: TextEditorTool): boolean {
    return this.tools().has(tool);
  }

  setContent(html: string): void {
    this.root.innerHTML = html;
    ensureStructure(this.root);
    this.history.clear();
    this.storedFormats = null;
    this.lastRange = null;
  }

  getContent(): string {
    return sanitizeRichText(this.root.innerHTML);
  }

  clearHistory(): void {
    this.history.clear();
  }

  /** Remembers the selection while it is inside the editor. Returns whether it is. */
  trackSelection(): boolean {
    const range = editorRange(this.root);
    if (!range) {
      return false;
    }
    this.lastRange = range.cloneRange();
    if (this.storedFormats && !sameRange(this.storedFormats.at, range)) {
      this.storedFormats = null;
    }
    return true;
  }

  state(): TextEditorState {
    const history = { canUndo: this.history.canUndo, canRedo: this.history.canRedo };
    const range = editorRange(this.root) ?? this.keptRange();
    if (!range) {
      return { ...EMPTY_TEXT_EDITOR_STATE, ...history };
    }

    const stored =
      this.storedFormats && sameRange(this.storedFormats.at, range)
        ? this.storedFormats.formats
        : null;
    const marks = new Set(
      MARKS.filter((mark) =>
        stored
          ? stored.some((format) => format.kind === 'mark' && format.mark === mark)
          : hasFamilyEverywhere(this.root, range, mark),
      ),
    );
    const textColor = stored
      ? stored.find((format) => format.kind === 'textColor')
      : commonFormat(this.root, range, 'textColor');
    const backgroundColor = stored
      ? stored.find((format) => format.kind === 'backgroundColor')
      : commonFormat(this.root, range, 'backgroundColor');
    const link = commonFormat(this.root, range, 'link');

    const block = textBlocksIn(this.root, range)[0];
    return {
      ...history,
      marks,
      blockType: block ? blockTypeOf(block) : 'paragraph',
      listType: block ? listTypeOf(block) : null,
      blockquote:
        !!block &&
        closestWithin(block, this.root, (element) => element.tagName === 'BLOCKQUOTE') !== null,
      alignment: block ? alignmentOf(block) : 'left',
      textColor: textColor?.kind === 'textColor' ? textColor.color : null,
      backgroundColor: backgroundColor?.kind === 'backgroundColor' ? backgroundColor.color : null,
      link: link?.kind === 'link' ? link.href : null,
      linkText: this.linkAround(range)?.textContent ?? range.toString(),
      canIndent: block?.tagName === 'LI' && block.previousElementSibling?.tagName === 'LI',
      canOutdent: block?.tagName === 'LI',
    };
  }

  /** Runs a toolbar or keyboard command. Returns whether the content changed. */
  execute(command: TextEditorCommand): boolean {
    if (command.type === 'undo') {
      return this.undo();
    }
    if (command.type === 'redo') {
      return this.redo();
    }

    const range = this.commandRange();
    if (!range) {
      return false;
    }

    const formatsOnly =
      command.type === 'mark' ||
      command.type === 'textColor' ||
      command.type === 'backgroundColor' ||
      command.type === 'clearFormatting';
    if (range.collapsed && formatsOnly) {
      this.storeFormats(range, command);
      return false;
    }

    this.record('command');
    this.apply(range, command);
    return true;
  }

  handleKeydown(event: KeyboardEvent): KeydownResult {
    if (event.key === 'Tab' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const range = editorRange(this.root);
      const block = range ? textBlocksIn(this.root, range)[0] : undefined;
      // Outside lists Tab keeps moving focus, so keyboard users are never trapped in the editor.
      if (block?.tagName !== 'LI' || !this.allows('indent')) {
        return null;
      }
      event.preventDefault();
      return this.execute({ type: event.shiftKey ? 'outdent' : 'indent' }) ? 'changed' : 'state';
    }

    const action = keyActionFor(event);
    if (!action) {
      return null;
    }
    if (action === 'link') {
      if (!this.allows('link')) {
        return null;
      }
      event.preventDefault();
      return 'link';
    }
    // Browsers bold/italicize/underline natively on these keys; block that even for disabled tools.
    event.preventDefault();
    if (action.tool && !this.allows(action.tool)) {
      return null;
    }
    return this.execute(action.command) ? 'changed' : 'state';
  }

  /** Takes over the edits whose native result is inconsistent. Returns whether the content changed. */
  handleBeforeInput(event: InputEvent): boolean {
    const range = editorRange(this.root);
    if (!range) {
      return false;
    }

    switch (event.inputType) {
      case 'historyUndo':
        event.preventDefault();
        return this.undo();
      case 'historyRedo':
        event.preventDefault();
        return this.redo();
      case 'formatBold':
      case 'formatItalic':
      case 'formatUnderline':
      case 'formatStrikeThrough':
      case 'formatSuperscript':
      case 'formatSubscript':
        event.preventDefault();
        return this.formatFromInput(event.inputType);
      case 'insertParagraph':
        event.preventDefault();
        return this.splitAtCaret(range);
      case 'insertLineBreak':
        event.preventDefault();
        this.record('command');
        deleteSelection(this.root, range);
        this.finish(caretAt(insertLineBreak(range)));
        return true;
      case 'insertText':
      case 'insertReplacementText':
        return this.insertText(event, range);
      case 'deleteContentBackward':
        if (range.collapsed && this.liftBlockAtStart(range)) {
          event.preventDefault();
          return true;
        }
        this.record('typing');
        return false;
      case 'insertFromDrop':
      case 'deleteByDrag':
        event.preventDefault();
        return false;
      case 'insertFromPaste':
        return false;
      default:
        this.record('typing');
        return false;
    }
  }

  /** Post-processes a native edit: Markdown-like shortcuts, autolinks and structure repair. */
  handleInput(event: Event): void {
    const range = editorRange(this.root);
    if (
      event instanceof InputEvent &&
      event.inputType === 'insertText' &&
      event.data &&
      range?.collapsed
    ) {
      if (WHITESPACE.test(event.data)) {
        if (this.applyBlockShortcut(range)) {
          return;
        }
        this.autolink(range, false);
      } else if (/[*`~]/.test(event.data)) {
        this.applyInlineShortcut(range);
      }
    }
    this.repairStructure();
  }

  /** Inserts clipboard content sanitized to the enabled tools. Returns whether the content changed. */
  handlePaste(event: ClipboardEvent): boolean {
    const data = event.clipboardData;
    const range = editorRange(this.root);
    event.preventDefault();
    if (!data || !range) {
      return false;
    }

    const text = data.getData('text/plain');
    const href = URL_LIKE.test(text.trim()) ? normalizeUrl(text) : null;
    if (href && !range.collapsed && this.allows('link')) {
      this.record('command');
      this.transform(range, (working) =>
        setFamily(this.root, working, 'link', { kind: 'link', href }),
      );
      return true;
    }

    const html = data.getData('text/html') || plainTextToHtml(this.root.ownerDocument, text);
    const content = sanitizeRichText(html, this.tools());
    if (!content) {
      return false;
    }

    this.record('command');
    this.finish(caretAt(insertHtml(this.root, range, content)));
    return true;
  }

  private keptRange(): Range | null {
    return this.lastRange && this.root.contains(this.lastRange.startContainer)
      ? this.lastRange
      : null;
  }

  /** The selection to act on: the live one, or the one kept while the toolbar had focus. */
  private commandRange(): Range | null {
    const live = editorRange(this.root);
    if (live) {
      return live;
    }

    const kept = this.keptRange();
    this.root.focus({ preventScroll: true });
    if (kept) {
      selectRange(kept);
      return editorRange(this.root) ?? kept;
    }
    return editorRange(this.root);
  }

  private apply(range: Range, command: TextEditorCommand): void {
    const root = this.root;
    switch (command.type) {
      case 'mark':
        this.transform(range, (working) => toggleMark(root, working, command.mark));
        break;
      case 'textColor':
        this.transform(range, (working) =>
          setFamily(
            root,
            working,
            'textColor',
            command.color ? { kind: 'textColor', color: command.color } : null,
          ),
        );
        break;
      case 'backgroundColor':
        this.transform(range, (working) =>
          setFamily(
            root,
            working,
            'backgroundColor',
            command.color ? { kind: 'backgroundColor', color: command.color } : null,
          ),
        );
        break;
      case 'clearFormatting':
        this.transform(range, (working) => clearFormatting(root, working));
        break;
      case 'link':
        this.transform(range, (working) => this.setLink(working, command.href, command.text));
        break;
      case 'blockType':
        this.transform(range, (working) =>
          setBlockType(textBlocksIn(root, working), command.blockType),
        );
        break;
      case 'list':
        this.transform(range, (working) =>
          toggleList(root, textBlocksIn(root, working), command.listType),
        );
        break;
      case 'blockquote':
        this.transform(range, (working) => toggleBlockquote(root, textBlocksIn(root, working)));
        break;
      case 'indent':
        this.transform(range, (working) =>
          textBlocksIn(root, working)
            .filter((block) => block.tagName === 'LI')
            .forEach(indentListItem),
        );
        break;
      case 'outdent':
        this.transform(range, (working) =>
          textBlocksIn(root, working)
            .filter((block) => block.tagName === 'LI')
            .forEach(outdentListItem),
        );
        break;
      case 'align':
        this.transform(range, (working) =>
          setAlignment(textBlocksIn(root, working), command.alignment),
        );
        break;
      case 'horizontalRule':
        this.transform(range, (working) =>
          firstTextPosition(insertHorizontalRule(root, textBlocksIn(root, working)[0] ?? null)),
        );
        break;
      case 'undo':
      case 'redo':
        break;
    }
  }

  /** Runs a DOM transform keeping the selection, then tidies the tree. A returned position moves the caret there. */
  private transform(range: Range, fn: (range: Range) => DomPosition | void): void {
    const result = withMarkers(this.root, range, fn);
    this.finish(result.value ? caretAt(result.value) : result.range);
  }

  private finish(selection: Range): void {
    normalizeInline(this.root);
    normalizeLists(this.root);
    ensureStructure(this.root);
    selectRange(selection);
    this.lastRange = selection.cloneRange();
  }

  /** The link that contains the whole range, if any. */
  private linkAround(range: Range): HTMLElement | null {
    const isLink = (element: HTMLElement) => element.tagName === 'A';
    const start = closestWithin(range.startContainer, this.root, isLink);
    const end = closestWithin(range.endContainer, this.root, isLink);
    return start && start === end ? start : null;
  }

  /**
   * Links the selection, edits the link around it, or inserts a new one. A `text` different from
   * the current one replaces the visible text; without text a new link shows its URL.
   */
  private setLink(range: Range, href: string | null, text?: string): DomPosition | void {
    const label = text?.trim() ?? '';
    const link = this.linkAround(range);

    if (!href) {
      if (link) {
        unwrap(link);
      } else if (!range.collapsed) {
        setFamily(this.root, range, 'link', null);
      }
      return;
    }

    if (link) {
      link.setAttribute('href', href);
      if (label && label !== link.textContent) {
        link.textContent = label;
      }
      return this.positionAfter(link);
    }

    if (!range.collapsed && (!label || label === range.toString())) {
      setFamily(this.root, range, 'link', { kind: 'link', href });
      return;
    }

    const anchor = this.root.ownerDocument.createElement('a');
    anchor.setAttribute('href', href);
    anchor.setAttribute('rel', 'noopener noreferrer');
    anchor.setAttribute('target', '_blank');
    anchor.textContent = label || href.replace(/^mailto:/i, '');
    range.deleteContents();
    range.insertNode(anchor);
    return this.positionAfter(anchor);
  }

  private positionAfter(node: Node): DomPosition | void {
    return node.parentNode ? { node: node.parentNode, offset: indexOf(node) + 1 } : undefined;
  }

  private storeFormats(range: Range, command: TextEditorCommand): void {
    const base = this.storedFormats?.formats ?? formatsAt(this.root, range.startContainer);
    let formats: InlineFormat[];
    switch (command.type) {
      case 'mark':
        formats = toggleFormatIn(base, command.mark);
        break;
      case 'textColor':
        formats = replaceFamilyIn(
          base,
          'textColor',
          command.color ? { kind: 'textColor', color: command.color } : null,
        );
        break;
      case 'backgroundColor':
        formats = replaceFamilyIn(
          base,
          'backgroundColor',
          command.color ? { kind: 'backgroundColor', color: command.color } : null,
        );
        break;
      default:
        formats = base.filter((format) => format.kind === 'link');
    }
    this.storedFormats = { formats, at: range.cloneRange() };
  }

  private formatFromInput(inputType: string): boolean {
    const marks: Record<string, TextEditorMark> = {
      formatBold: 'bold',
      formatItalic: 'italic',
      formatUnderline: 'underline',
      formatStrikeThrough: 'strike',
      formatSuperscript: 'superscript',
      formatSubscript: 'subscript',
    };
    const mark = marks[inputType];
    return mark && this.allows(mark) ? this.execute({ type: 'mark', mark }) : false;
  }

  private insertText(event: InputEvent, range: Range): boolean {
    const stored = this.storedFormats;
    if (!stored || !event.data || !sameRange(stored.at, range)) {
      this.record('typing');
      return false;
    }

    event.preventDefault();
    this.record('typing');
    deleteSelection(this.root, range);
    const text = insertFormattedText(this.root, range, event.data, stored.formats);
    this.storedFormats = null;
    this.finish(caretAt({ node: text, offset: text.length }));
    return true;
  }

  private splitAtCaret(range: Range): boolean {
    this.record('command');
    deleteSelection(this.root, range);
    this.autolink(range, true);
    const caret = splitBlock(this.root, editorRange(this.root) ?? range);
    if (caret) {
      this.finish(caretAt(caret));
    }
    return true;
  }

  /** Backspace at the start of a list item, heading or quote lifts it instead of merging blocks. */
  private liftBlockAtStart(range: Range): boolean {
    const block = textBlockOf(range.startContainer, this.root);
    if (!block || !isAtBlockStart(block, range)) {
      return false;
    }

    const quote = block.parentElement;
    const isHeading = /^H[1-3]$/.test(block.tagName);
    const leavesQuote =
      block.tagName === 'P' && quote?.tagName === 'BLOCKQUOTE' && block === quote.firstElementChild;
    if (block.tagName !== 'LI' && !isHeading && !leavesQuote) {
      return false;
    }

    this.record('command');
    let target = block;
    if (block.tagName === 'LI') {
      target = outdentListItem(block);
    } else if (isHeading) {
      target = renameElement(block, 'p');
    } else if (quote) {
      quote.before(block);
      if (!quote.firstElementChild) {
        quote.remove();
      }
    }
    this.finish(caretAt(firstTextPosition(target)));
    return true;
  }

  private applyBlockShortcut(range: Range): boolean {
    const block = textBlockOf(range.startContainer, this.root);
    if (!block || block.tagName !== 'P') {
      return false;
    }

    const prefix = this.root.ownerDocument.createRange();
    prefix.setStart(block, 0);
    prefix.setEnd(range.startContainer, range.startOffset);
    const command = matchBlockShortcut(prefix.toString(), (tool) => this.allows(tool));
    if (!command) {
      return false;
    }

    this.record('command');
    prefix.deleteContents();
    ensureBreak(block);
    this.apply(caretAt(firstTextPosition(block)), command);
    return true;
  }

  private applyInlineShortcut(range: Range): void {
    const node = range.startContainer;
    if (
      !(node instanceof Text) ||
      closestWithin(node, this.root, (element) => element.tagName === 'CODE')
    ) {
      return;
    }

    const match = matchInlineShortcut(node.data.slice(0, range.startOffset), (tool) =>
      this.allows(tool),
    );
    if (!match) {
      return;
    }

    this.record('command');
    const doc = this.root.ownerDocument;
    const delimited = doc.createRange();
    delimited.setStart(node, match.start);
    delimited.setEnd(node, match.start + match.length);
    delimited.deleteContents();

    const content = doc.createTextNode(match.content);
    delimited.insertNode(content);
    const format = wrap(content, doc.createElement(MARK_TAGS[match.mark].toLowerCase()));
    const parent = format.parentNode;
    if (!parent) {
      return;
    }

    this.finish(caretAt({ node: parent, offset: indexOf(format) + 1 }));
    const caret = editorRange(this.root);
    if (caret) {
      // Text typed next should not continue the format that was just closed.
      this.storedFormats = { formats: formatsAt(this.root, parent), at: caret.cloneRange() };
    }
  }

  /** Links the URL right before the caret. `atLineEnd` is for Enter, where no space was typed. */
  private autolink(range: Range, atLineEnd: boolean): void {
    const node = range.startContainer;
    if (
      !this.allows('link') ||
      !(node instanceof Text) ||
      closestWithin(node, this.root, (element) => element.tagName === 'A')
    ) {
      return;
    }

    const before = node.data.slice(0, range.startOffset) + (atLineEnd ? ' ' : '');
    const match = matchAutolink(before);
    const href = match ? normalizeUrl(match.url) : null;
    if (!match || !href) {
      return;
    }

    if (!atLineEnd) {
      this.record('command');
    }
    const url = this.root.ownerDocument.createRange();
    url.setStart(node, match.start);
    url.setEnd(node, match.start + match.url.length);
    const caret = withMarkers(this.root, range, () =>
      setFamily(this.root, url, 'link', { kind: 'link', href }),
    );
    if (!atLineEnd) {
      this.finish(caret.range);
    } else {
      selectRange(caret.range);
    }
  }

  /** Native edits (deleting across blocks, browser quirks) can leave inline content at the top level. */
  private repairStructure(): void {
    const children = Array.from(this.root.childNodes);
    const valid =
      children.length > 0 &&
      children.every(
        (child) => isElement(child) && BLOCK_TAGS.has(child.tagName) && child.tagName !== 'LI',
      );
    if (valid) {
      return;
    }

    const range = editorRange(this.root);
    if (range) {
      const result = withMarkers(this.root, range, () => ensureStructure(this.root));
      selectRange(result.range);
    } else {
      ensureStructure(this.root);
    }
  }

  private snapshot(): EditorSnapshot {
    const kept = this.keptRange();
    const keptSelection = kept
      ? {
          start: offsetOf(this.root, kept.startContainer, kept.startOffset),
          end: offsetOf(this.root, kept.endContainer, kept.endOffset),
        }
      : null;
    return { html: this.root.innerHTML, selection: saveSelection(this.root) ?? keptSelection };
  }

  /** Records the state before a change. Consecutive typing within a short pause is one undo step. */
  private record(kind: 'command' | 'typing'): void {
    const now = Date.now();
    const continuesTyping = kind === 'typing' && now - this.lastTypingAt < TYPING_GROUP_MS;
    this.lastTypingAt = kind === 'typing' ? now : Number.NEGATIVE_INFINITY;
    if (!continuesTyping) {
      this.history.record(this.snapshot());
    }
  }

  private undo(): boolean {
    const snapshot = this.history.undo(this.snapshot());
    return snapshot ? this.restore(snapshot) : false;
  }

  private redo(): boolean {
    const snapshot = this.history.redo(this.snapshot());
    return snapshot ? this.restore(snapshot) : false;
  }

  private restore(snapshot: EditorSnapshot): boolean {
    this.root.innerHTML = snapshot.html;
    this.storedFormats = null;
    this.lastTypingAt = Number.NEGATIVE_INFINITY;
    this.root.focus({ preventScroll: true });
    if (snapshot.selection) {
      this.lastRange = restoreSelection(this.root, snapshot.selection).cloneRange();
    }
    return true;
  }
}
