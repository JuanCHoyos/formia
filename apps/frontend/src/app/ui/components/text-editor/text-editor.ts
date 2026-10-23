import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

import { TranslatePipe } from '@ngx-translate/core';

import type { TextEditorCommand, TextEditorTool } from '../../types/text-editor';
import { richTextLength, sanitizeRichText } from '../../utils/rich-text.utils';
import { TextEditorEngine } from './engine/text-editor-engine';
import { TextEditorToolbar } from './text-editor-toolbar/text-editor-toolbar';
import { DEFAULT_TEXT_EDITOR_TOOLS, EMPTY_TEXT_EDITOR_STATE } from './text-editor.constants';

let nextId = 0;

@Component({
  selector: 'app-text-editor',
  imports: [TextEditorToolbar, TranslatePipe],
  templateUrl: './text-editor.html',
  host: {
    class: 'block min-w-0 max-w-full',
    '(document:selectionchange)': 'onSelectionChange()',
  },
})
export class TextEditor implements FormValueControl<string> {
  readonly value = model('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly name = input('');
  readonly maxLength = input<number | undefined>(undefined);
  readonly touch = output<void>();

  readonly inputId = input(`text-editor-${nextId++}`);
  readonly placeholder = input<string>();
  readonly ariaLabel = input<string>();
  readonly ariaLabelledBy = input<string>();
  readonly describedBy = input<string>();
  readonly tools = input<readonly TextEditorTool[]>(DEFAULT_TEXT_EDITOR_TOOLS);

  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');
  private readonly toolbar = viewChild(TextEditorToolbar);

  protected readonly enabledTools = computed<ReadonlySet<TextEditorTool>>(
    () => new Set(this.tools()),
  );
  protected readonly state = signal(EMPTY_TEXT_EDITOR_STATE);
  protected readonly editable = computed(() => !this.disabled() && !this.readonly());
  protected readonly empty = computed(() => this.value() === '');
  protected readonly length = computed(() => richTextLength(this.value()));
  protected readonly overLimit = computed(() => {
    const max = this.maxLength();
    return max !== undefined && this.length() > max;
  });
  protected readonly showsError = computed(
    () => (this.invalid() && this.touched()) || this.overLimit(),
  );
  protected readonly frameClass = computed(() => {
    const base = 'overflow-hidden rounded-control border transition-colors';
    if (this.disabled()) {
      return `${base} border-border bg-surface-2 opacity-60`;
    }
    const border = this.showsError()
      ? 'border-danger'
      : 'border-border-strong hover:border-border-hover focus-within:border-brand';
    return `${base} ${border} bg-surface focus-within:focus-ring`;
  });
  protected readonly counterId = computed(() => `${this.inputId()}-counter`);
  protected readonly describedByIds = computed(
    () =>
      [this.describedBy(), this.maxLength() !== undefined ? this.counterId() : null]
        .filter(Boolean)
        .join(' ') || null,
  );

  private engine: TextEditorEngine | null = null;
  private emitted: string | null = null;

  constructor() {
    afterNextRender(() => {
      this.engine = new TextEditorEngine(this.content().nativeElement, () => this.enabledTools());
      this.render(untracked(this.value));
    });

    effect(() => {
      const value = this.value();
      if (this.engine && value !== this.emitted) {
        untracked(() => this.render(value));
      }
    });
  }

  focus(options?: FocusOptions): void {
    this.content().nativeElement.focus(options);
  }

  reset(): void {
    this.engine?.clearHistory();
    this.refreshState();
  }

  protected execute(command: TextEditorCommand): void {
    if (!this.engine || !this.editable()) {
      return;
    }
    if (this.engine.execute(command)) {
      this.sync();
    } else {
      this.refreshState();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const result = this.engine?.handleKeydown(event);
    if (result === 'changed') {
      this.sync();
    } else if (result === 'state') {
      this.refreshState();
    } else if (result === 'link') {
      this.toolbar()?.openLink();
    }
  }

  protected onBeforeInput(event: Event): void {
    if (event instanceof InputEvent && this.engine?.handleBeforeInput(event)) {
      this.sync();
    }
  }

  protected onInput(event: Event): void {
    this.engine?.handleInput(event);
    this.sync();
  }

  protected onPaste(event: ClipboardEvent): void {
    if (this.engine?.handlePaste(event)) {
      this.sync();
    }
  }

  protected onSelectionChange(): void {
    if (this.engine?.trackSelection()) {
      this.refreshState();
    }
  }

  protected refocus(): void {
    this.focus({ preventScroll: true });
  }

  private render(value: string): void {
    this.engine?.setContent(sanitizeRichText(value));
    this.emitted = value;
    this.refreshState();
  }

  private sync(): void {
    if (!this.engine) {
      return;
    }
    const html = this.engine.getContent();
    this.emitted = html;
    if (html !== this.value()) {
      this.value.set(html);
    }
    this.refreshState();
  }

  private refreshState(): void {
    if (this.engine) {
      this.state.set(this.engine.state());
    }
  }
}
