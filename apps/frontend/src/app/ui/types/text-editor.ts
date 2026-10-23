import type { BrandName } from '../../core/theme/types/brand';

export type TextEditorTool =
  | 'align'
  | 'backgroundColor'
  | 'blockquote'
  | 'bold'
  | 'bulletList'
  | 'clearFormatting'
  | 'code'
  | 'heading'
  | 'history'
  | 'horizontalRule'
  | 'indent'
  | 'italic'
  | 'link'
  | 'orderedList'
  | 'strike'
  | 'subscript'
  | 'superscript'
  | 'textColor'
  | 'underline';

export type TextEditorMark =
  'bold' | 'code' | 'italic' | 'strike' | 'subscript' | 'superscript' | 'underline';

export type TextEditorBlockType = 'heading1' | 'heading2' | 'heading3' | 'paragraph';

export type TextEditorListType = 'bullet' | 'ordered';

export type TextEditorAlignment = 'center' | 'justify' | 'left' | 'right';

export type TextEditorCommand =
  | { type: 'align'; alignment: TextEditorAlignment }
  | { type: 'backgroundColor'; color: BrandName | null }
  | { type: 'blockquote' }
  | { type: 'blockType'; blockType: TextEditorBlockType }
  | { type: 'clearFormatting' }
  | { type: 'horizontalRule' }
  | { type: 'indent' }
  | { type: 'link'; href: string | null; text?: string }
  | { type: 'list'; listType: TextEditorListType }
  | { type: 'mark'; mark: TextEditorMark }
  | { type: 'outdent' }
  | { type: 'redo' }
  | { type: 'textColor'; color: BrandName | null }
  | { type: 'undo' };

export interface TextEditorState {
  readonly marks: ReadonlySet<TextEditorMark>;
  readonly blockType: TextEditorBlockType;
  readonly listType: TextEditorListType | null;
  readonly blockquote: boolean;
  readonly alignment: TextEditorAlignment;
  readonly textColor: BrandName | null;
  readonly backgroundColor: BrandName | null;
  readonly link: string | null;
  /** Visible text of the link at the selection, or the selected text, to prefill the link form. */
  readonly linkText: string;
  readonly canIndent: boolean;
  readonly canOutdent: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export type TextEditorToolbarItemId =
  | 'align'
  | 'backgroundColor'
  | 'blockquote'
  | 'bulletList'
  | 'clearFormatting'
  | 'heading'
  | 'horizontalRule'
  | 'indent'
  | 'link'
  | 'orderedList'
  | 'outdent'
  | 'redo'
  | 'textColor'
  | 'undo'
  | TextEditorMark;

/** `menu` items open a popover (heading, alignment, colors, link) instead of running a command. */
export interface TextEditorToolbarItem {
  readonly id: TextEditorToolbarItemId;
  readonly tool: TextEditorTool;
  readonly icon: string;
  readonly label: string;
  readonly group: number;
  /** Lower values stay visible longer when the toolbar runs out of space. */
  readonly priority: number;
  readonly kind: 'button' | 'menu';
  readonly shortcut?: string;
}
