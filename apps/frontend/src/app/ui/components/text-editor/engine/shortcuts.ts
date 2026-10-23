import type { TextEditorCommand, TextEditorMark, TextEditorTool } from '../../../types/text-editor';

const SPACE = '[\\s\\u00a0]';

/** Markdown-like prefixes typed at the start of a paragraph and followed by a space. */
const BLOCK_RULES: readonly {
  pattern: RegExp;
  tool: TextEditorTool;
  command: TextEditorCommand;
}[] = [
  {
    pattern: new RegExp(`^#${SPACE}$`),
    tool: 'heading',
    command: { type: 'blockType', blockType: 'heading1' },
  },
  {
    pattern: new RegExp(`^##${SPACE}$`),
    tool: 'heading',
    command: { type: 'blockType', blockType: 'heading2' },
  },
  {
    pattern: new RegExp(`^###${SPACE}$`),
    tool: 'heading',
    command: { type: 'blockType', blockType: 'heading3' },
  },
  {
    pattern: new RegExp(`^[-*+]${SPACE}$`),
    tool: 'bulletList',
    command: { type: 'list', listType: 'bullet' },
  },
  {
    pattern: new RegExp(`^\\d+\\.${SPACE}$`),
    tool: 'orderedList',
    command: { type: 'list', listType: 'ordered' },
  },
  { pattern: new RegExp(`^>${SPACE}$`), tool: 'blockquote', command: { type: 'blockquote' } },
  {
    pattern: new RegExp(`^---${SPACE}$`),
    tool: 'horizontalRule',
    command: { type: 'horizontalRule' },
  },
];

/** Delimited text closed by the character just typed, e.g. `**bold**`. */
const INLINE_RULES: readonly { pattern: RegExp; mark: TextEditorMark }[] = [
  { pattern: /\*\*([^*\s](?:[^*]*[^*\s])?)\*\*$/, mark: 'bold' },
  { pattern: /~~([^~\s](?:[^~]*[^~\s])?)~~$/, mark: 'strike' },
  { pattern: /(?<![*\w])\*([^*\s](?:[^*]*[^*\s])?)\*$/, mark: 'italic' },
  { pattern: /(?<![\w`])`([^`\s](?:[^`]*[^`\s])?)`$/, mark: 'code' },
];

const URL_BEFORE_SPACE = new RegExp(`(?:^|${SPACE})((?:https?://|www\\.)[^\\s\\u00a0<]+)${SPACE}$`);

export interface InlineShortcut {
  mark: TextEditorMark;
  /** Index where the delimited text (including delimiters) starts. */
  start: number;
  length: number;
  content: string;
}

export interface AutolinkMatch {
  start: number;
  url: string;
}

export const matchBlockShortcut = (
  prefix: string,
  allows: (tool: TextEditorTool) => boolean,
): TextEditorCommand | null => {
  const rule = BLOCK_RULES.find((item) => item.pattern.test(prefix) && allows(item.tool));
  return rule?.command ?? null;
};

export const matchInlineShortcut = (
  textBefore: string,
  allows: (tool: TextEditorTool) => boolean,
): InlineShortcut | null => {
  for (const rule of INLINE_RULES) {
    const match = rule.pattern.exec(textBefore);
    if (match && allows(rule.mark)) {
      return { mark: rule.mark, start: match.index, length: match[0].length, content: match[1] };
    }
  }
  return null;
};

/** A URL right before the space or line just typed, without trailing punctuation. */
export const matchAutolink = (textBefore: string): AutolinkMatch | null => {
  const match = URL_BEFORE_SPACE.exec(textBefore);
  if (!match) {
    return null;
  }
  const url = match[1].replace(/[.,:;!?)\]'"]+$/, '');
  const start = match.index + match[0].indexOf(match[1]);
  return url.length > 4 ? { start, url } : null;
};

/** What a keyboard shortcut does: run a command (gated by its tool, `null` = always) or open the link popover. */
export type KeyAction = 'link' | { command: TextEditorCommand; tool: TextEditorTool | null };

const MOD_KEYS: Record<string, KeyAction | undefined> = {
  b: { command: { type: 'mark', mark: 'bold' }, tool: 'bold' },
  i: { command: { type: 'mark', mark: 'italic' }, tool: 'italic' },
  u: { command: { type: 'mark', mark: 'underline' }, tool: 'underline' },
  e: { command: { type: 'mark', mark: 'code' }, tool: 'code' },
  '.': { command: { type: 'mark', mark: 'superscript' }, tool: 'superscript' },
  ',': { command: { type: 'mark', mark: 'subscript' }, tool: 'subscript' },
  '\\': { command: { type: 'clearFormatting' }, tool: 'clearFormatting' },
  k: 'link',
  z: { command: { type: 'undo' }, tool: null },
  y: { command: { type: 'redo' }, tool: null },
};

/** Shift shortcuts are matched by physical key, since Shift changes `event.key` (e.g. 7 → /). */
const MOD_SHIFT_CODES: Record<string, KeyAction | undefined> = {
  KeyX: { command: { type: 'mark', mark: 'strike' }, tool: 'strike' },
  Digit7: { command: { type: 'list', listType: 'ordered' }, tool: 'orderedList' },
  Digit8: { command: { type: 'list', listType: 'bullet' }, tool: 'bulletList' },
  Digit9: { command: { type: 'blockquote' }, tool: 'blockquote' },
  KeyL: { command: { type: 'align', alignment: 'left' }, tool: 'align' },
  KeyE: { command: { type: 'align', alignment: 'center' }, tool: 'align' },
  KeyR: { command: { type: 'align', alignment: 'right' }, tool: 'align' },
  KeyJ: { command: { type: 'align', alignment: 'justify' }, tool: 'align' },
  KeyZ: { command: { type: 'redo' }, tool: null },
};

const MOD_ALT_CODES: Record<string, KeyAction | undefined> = {
  Digit0: { command: { type: 'blockType', blockType: 'paragraph' }, tool: 'heading' },
  Digit1: { command: { type: 'blockType', blockType: 'heading1' }, tool: 'heading' },
  Digit2: { command: { type: 'blockType', blockType: 'heading2' }, tool: 'heading' },
  Digit3: { command: { type: 'blockType', blockType: 'heading3' }, tool: 'heading' },
};

export const keyActionFor = (event: KeyboardEvent): KeyAction | null => {
  if (!(event.ctrlKey || event.metaKey)) {
    return null;
  }
  if (event.altKey) {
    return event.shiftKey ? null : (MOD_ALT_CODES[event.code] ?? null);
  }
  return event.shiftKey
    ? (MOD_SHIFT_CODES[event.code] ?? null)
    : (MOD_KEYS[event.key.toLowerCase()] ?? null);
};
