import {
  afterNextRender,
  Component,
  ElementRef,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { form, FormField, validate } from '@angular/forms/signals';

import { TranslatePipe } from '@ngx-translate/core';

import { InputTextModule } from 'primeng/inputtext';

import { normalizeUrl } from '../../../utils/rich-text.utils';
import { Button } from '../../button/button';
import { FieldError } from '../../field-error/field-error';

export interface TextEditorLinkValue {
  href: string;
  text: string;
}

let nextId = 0;

/** Edits the visible text and URL of a link; the text is optional and defaults to the URL. */
@Component({
  selector: 'app-text-editor-link-form',
  imports: [Button, FieldError, FormField, InputTextModule, TranslatePipe],
  template: `
    <form
      class="flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-3"
      novalidate
      (submit)="submit($event)"
    >
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-text-3" [for]="textId">
          {{ 'textEditor.link.text' | translate }}
        </label>
        <input
          #textInput
          pInputText
          type="text"
          class="w-full"
          [id]="textId"
          [formField]="linkForm.text"
          [placeholder]="'textEditor.link.textPlaceholder' | translate"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-text-3" [for]="urlId">
          {{ 'textEditor.link.label' | translate }}
        </label>
        <input
          #urlInput
          pInputText
          type="text"
          inputmode="url"
          autocomplete="url"
          class="w-full"
          placeholder="https://"
          [id]="urlId"
          [formField]="linkForm.url"
          [class.p-invalid]="linkForm.url().invalid() && linkForm.url().touched()"
          [attr.aria-describedby]="errorId"
        />
        <app-field-error [state]="linkForm.url()" [id]="errorId" />
      </div>
      <div class="flex justify-end gap-2">
        @if (href()) {
          <app-button variant="text" severity="danger" size="small" (pressed)="removed.emit()">
            {{ 'textEditor.link.remove' | translate }}
          </app-button>
        }
        <app-button type="submit" size="small">
          {{ 'textEditor.link.apply' | translate }}
        </app-button>
      </div>
    </form>
  `,
})
export class TextEditorLinkForm {
  readonly href = input<string | null>(null);
  readonly text = input('');
  readonly applied = output<TextEditorLinkValue>();
  readonly removed = output<void>();

  private readonly textInput = viewChild.required<ElementRef<HTMLInputElement>>('textInput');
  private readonly urlInput = viewChild.required<ElementRef<HTMLInputElement>>('urlInput');

  protected readonly textId = `text-editor-link-text-${nextId++}`;
  protected readonly urlId = `${this.textId}-url`;
  protected readonly errorId = `${this.textId}-error`;

  private readonly model = linkedSignal(() => ({ text: this.text(), url: this.href() ?? '' }));
  protected readonly linkForm = form(this.model, (path) => {
    validate(path.url, ({ value }) =>
      normalizeUrl(value()) ? undefined : { kind: 'url', message: 'textEditor.link.invalid' },
    );
  });

  constructor() {
    // With text already there (a selection or an existing link) the URL is what is left to fill.
    afterNextRender(() =>
      (this.model().text ? this.urlInput() : this.textInput()).nativeElement.focus(),
    );
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.linkForm.url().markAsTouched();
    const href = normalizeUrl(this.model().url);
    if (href) {
      this.applied.emit({ href, text: this.model().text.trim() });
    }
  }
}
