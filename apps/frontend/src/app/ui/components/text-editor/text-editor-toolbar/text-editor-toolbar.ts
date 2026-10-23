import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { Popover, PopoverModule } from 'primeng/popover';

import { BRAND_NAMES } from '../../../../core/theme/brand';
import type {
  TextEditorCommand,
  TextEditorState,
  TextEditorTool,
  TextEditorToolbarItem,
  TextEditorToolbarItemId,
} from '../../../types/text-editor';
import { TextEditorColorPicker } from '../text-editor-color-picker/text-editor-color-picker';
import { TextEditorLinkForm } from '../text-editor-link-form/text-editor-link-form';
import { TextEditorOptionMenu } from '../text-editor-option-menu/text-editor-option-menu';
import {
  ALIGNMENT_OPTIONS,
  BLOCK_TYPE_OPTIONS,
  TEXT_EDITOR_ICONS,
  TEXT_EDITOR_TOOLBAR_ITEMS,
} from '../text-editor.constants';

type MenuId = 'align' | 'backgroundColor' | 'heading' | 'link' | 'more' | 'textColor';

interface ToolbarEntry {
  readonly item: TextEditorToolbarItem;
  readonly separatorBefore: boolean;
  readonly icon: string;
  readonly pressed: boolean | null;
  readonly disabled: boolean;
  readonly colorClass: string | null;
}

/** Widths in px used to decide how many buttons fit before the rest move into "more". */
const BUTTON_WIDTH = 34;
const SEPARATOR_WIDTH = 9;
const MORE_WIDTH = 42;
/** Horizontal padding of the toolbar row (px-1.5 on both sides). */
const TOOLBAR_PADDING = 12;

const requiredWidth = (items: readonly TextEditorToolbarItem[]): number => {
  const groups = new Set(items.map((item) => item.group)).size;
  return items.length * BUTTON_WIDTH + Math.max(0, groups - 1) * SEPARATOR_WIDTH;
};

/** The items that fit in `width`, picked by priority; everything fits when the width is unknown. */
export const fitToolbarItems = (
  items: readonly TextEditorToolbarItem[],
  width: number,
): ReadonlySet<TextEditorToolbarItemId> => {
  if (requiredWidth(items) <= width) {
    return new Set(items.map((item) => item.id));
  }

  const visible: TextEditorToolbarItem[] = [];
  for (const item of [...items].sort((a, b) => a.priority - b.priority)) {
    if (requiredWidth([...visible, item]) > width - MORE_WIDTH) {
      break;
    }
    visible.push(item);
  }
  return new Set(visible.map((item) => item.id));
};

const COMMANDS: Partial<Record<TextEditorToolbarItemId, TextEditorCommand>> = {
  undo: { type: 'undo' },
  redo: { type: 'redo' },
  bold: { type: 'mark', mark: 'bold' },
  italic: { type: 'mark', mark: 'italic' },
  underline: { type: 'mark', mark: 'underline' },
  strike: { type: 'mark', mark: 'strike' },
  code: { type: 'mark', mark: 'code' },
  superscript: { type: 'mark', mark: 'superscript' },
  subscript: { type: 'mark', mark: 'subscript' },
  bulletList: { type: 'list', listType: 'bullet' },
  orderedList: { type: 'list', listType: 'ordered' },
  blockquote: { type: 'blockquote' },
  indent: { type: 'indent' },
  outdent: { type: 'outdent' },
  horizontalRule: { type: 'horizontalRule' },
  clearFormatting: { type: 'clearFormatting' },
};

@Component({
  selector: 'app-text-editor-toolbar',
  imports: [
    NgIcon,
    PopoverModule,
    TextEditorColorPicker,
    TextEditorLinkForm,
    TextEditorOptionMenu,
    TranslatePipe,
  ],
  providers: [provideIcons(TEXT_EDITOR_ICONS)],
  templateUrl: './text-editor-toolbar.html',
  // inline-size containment keeps the buttons from widening the parent (which would cause a
  // horizontal scroll); the toolbar takes the available width and moves the rest into "more".
  host: { class: 'block min-w-0 [contain:inline-size]' },
})
export class TextEditorToolbar {
  readonly state = input.required<TextEditorState>();
  readonly tools = input.required<ReadonlySet<TextEditorTool>>();
  readonly disabled = input(false);
  /** Id of the editable area the toolbar acts on. */
  readonly controls = input.required<string>();
  readonly requested = output<TextEditorCommand>();
  /** A popover closed with the focus inside it (Escape); the editor takes the focus back. */
  readonly dismissed = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly headingPopover = viewChild.required<Popover>('headingPopover');
  private readonly alignPopover = viewChild.required<Popover>('alignPopover');
  private readonly textColorPopover = viewChild.required<Popover>('textColorPopover');
  private readonly backgroundColorPopover = viewChild.required<Popover>('backgroundColorPopover');
  private readonly linkPopover = viewChild.required<Popover>('linkPopover');
  private readonly morePopover = viewChild.required<Popover>('morePopover');
  private readonly moreButton = viewChild<ElementRef<HTMLButtonElement>>('moreButton');

  protected readonly blockTypeOptions = BLOCK_TYPE_OPTIONS;
  protected readonly alignmentOptions = ALIGNMENT_OPTIONS;
  protected readonly brands = BRAND_NAMES;

  private readonly width = signal(Number.POSITIVE_INFINITY);
  protected readonly openMenu = signal<MenuId | null>(null);
  private readonly rovingId = signal<string | null>(null);

  private readonly items = computed(() =>
    TEXT_EDITOR_TOOLBAR_ITEMS.filter((item) => this.tools().has(item.tool)),
  );
  private readonly visibleIds = computed(() =>
    fitToolbarItems(this.items(), this.width() - TOOLBAR_PADDING),
  );

  protected readonly entries = computed(() =>
    this.toEntries(this.items().filter((item) => this.visibleIds().has(item.id))),
  );
  protected readonly overflow = computed(() =>
    this.toEntries(this.items().filter((item) => !this.visibleIds().has(item.id))),
  );

  /** The one toolbar button reachable with Tab; arrow keys move between the others. */
  protected readonly tabStop = computed(() => {
    const ids = this.focusableIds();
    const roving = this.rovingId();
    return roving && ids.includes(roving) ? roving : (ids[0] ?? null);
  });

  private readonly focusableIds = computed(() => [
    ...this.entries()
      .filter((entry) => !entry.disabled)
      .map((entry) => entry.item.id),
    ...(this.overflow().length && !this.disabled() ? ['more'] : []),
  ]);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(([entry]) => this.width.set(entry.contentRect.width));
      observer.observe(this.host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** Opens the link popover (Ctrl+K), anchored to the link button or to "more" when it overflowed. */
  openLink(): void {
    const anchor =
      this.host.nativeElement.querySelector<HTMLElement>('[data-toolbar-item="link"]') ??
      this.moreButton()?.nativeElement ??
      this.host.nativeElement;
    this.open('link', anchor);
  }

  protected activate(item: TextEditorToolbarItem, anchor: HTMLElement): void {
    const fromOverflow = this.openMenu() === 'more';
    if (fromOverflow) {
      this.popover('more').hide();
    }

    const command = COMMANDS[item.id];
    if (command) {
      this.requested.emit(command);
      return;
    }

    if (
      item.id === 'heading' ||
      item.id === 'align' ||
      item.id === 'textColor' ||
      item.id === 'backgroundColor' ||
      item.id === 'link'
    ) {
      this.open(item.id, fromOverflow ? (this.moreButton()?.nativeElement ?? anchor) : anchor);
    }
  }

  protected toggleMore(anchor: HTMLElement): void {
    if (this.openMenu() === 'more') {
      this.popover('more').hide();
    } else {
      this.open('more', anchor);
    }
  }

  protected run(command: TextEditorCommand, menu: MenuId): void {
    this.popover(menu).hide();
    this.requested.emit(command);
  }

  protected onPopoverHide(menu: MenuId): void {
    if (this.openMenu() === menu) {
      this.openMenu.set(null);
    }
    // Closing by clicking elsewhere moves the focus there; closing with Escape drops it on <body>.
    const active = this.host.nativeElement.ownerDocument.activeElement;
    if (!active || active === this.host.nativeElement.ownerDocument.body) {
      this.dismissed.emit();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) {
      return;
    }
    const ids = this.focusableIds();
    const current = ids.indexOf(this.tabStop() ?? '');
    const last = ids.length - 1;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : event.key === 'ArrowRight'
            ? (current + 1) % ids.length
            : (current - 1 + ids.length) % ids.length;

    event.preventDefault();
    this.rovingId.set(ids[next]);
    this.host.nativeElement
      .querySelector<HTMLElement>(`[data-toolbar-item="${ids[next]}"]`)
      ?.focus();
  }

  protected onFocus(id: string): void {
    this.rovingId.set(id);
  }

  protected title(item: TextEditorToolbarItem, label: string): string {
    return item.shortcut ? `${label} (${item.shortcut})` : label;
  }

  protected ariaShortcut(item: TextEditorToolbarItem): string | null {
    return item.shortcut ? item.shortcut.replace('Ctrl', 'Control') : null;
  }

  private popover(menu: MenuId): Popover {
    switch (menu) {
      case 'heading':
        return this.headingPopover();
      case 'align':
        return this.alignPopover();
      case 'textColor':
        return this.textColorPopover();
      case 'backgroundColor':
        return this.backgroundColorPopover();
      case 'link':
        return this.linkPopover();
      case 'more':
        return this.morePopover();
    }
  }

  private open(menu: MenuId, anchor: HTMLElement): void {
    const current = this.openMenu();
    if (current && current !== menu) {
      this.popover(current).hide();
    }
    this.openMenu.set(menu);
    this.popover(menu).show(null, anchor);
  }

  private toEntries(items: readonly TextEditorToolbarItem[]): ToolbarEntry[] {
    const state = this.state();
    const disabled = this.disabled();
    return items.map((item, index) => ({
      item,
      separatorBefore: index > 0 && items[index - 1].group !== item.group,
      icon: this.iconFor(item, state),
      pressed: this.pressedFor(item, state),
      disabled: disabled || this.unavailable(item, state),
      colorClass:
        item.id === 'textColor' && state.textColor
          ? `te-color-${state.textColor}`
          : item.id === 'backgroundColor' && state.backgroundColor
            ? `te-bg-${state.backgroundColor}`
            : null,
    }));
  }

  private iconFor(item: TextEditorToolbarItem, state: TextEditorState): string {
    if (item.id === 'align') {
      return (
        ALIGNMENT_OPTIONS.find((option) => option.value === state.alignment)?.icon ?? item.icon
      );
    }
    if (item.id === 'heading' && state.blockType !== 'paragraph') {
      return (
        BLOCK_TYPE_OPTIONS.find((option) => option.value === state.blockType)?.icon ?? item.icon
      );
    }
    return item.icon;
  }

  /** `null` for buttons that open a popover or run an action instead of toggling. */
  private pressedFor(item: TextEditorToolbarItem, state: TextEditorState): boolean | null {
    switch (item.id) {
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strike':
      case 'code':
      case 'superscript':
      case 'subscript':
        return state.marks.has(item.id);
      case 'bulletList':
        return state.listType === 'bullet';
      case 'orderedList':
        return state.listType === 'ordered';
      case 'blockquote':
        return state.blockquote;
      default:
        return null;
    }
  }

  private unavailable(item: TextEditorToolbarItem, state: TextEditorState): boolean {
    switch (item.id) {
      case 'undo':
        return !state.canUndo;
      case 'redo':
        return !state.canRedo;
      case 'indent':
        return !state.canIndent;
      case 'outdent':
        return !state.canOutdent;
      default:
        return false;
    }
  }
}
