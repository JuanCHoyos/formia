import { Component, input, output } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { TEXT_EDITOR_ICONS } from '../text-editor.constants';

export interface TextEditorMenuOption<T> {
  readonly value: T;
  readonly icon: string;
  readonly label: string;
}

/** A short list of exclusive choices (block type, alignment) shown in a toolbar popover. */
@Component({
  selector: 'app-text-editor-option-menu',
  imports: [NgIcon, TranslatePipe],
  providers: [provideIcons(TEXT_EDITOR_ICONS)],
  template: `
    <div
      class="flex min-w-44 flex-col gap-0.5"
      role="group"
      [attr.aria-label]="label() | translate"
    >
      @for (option of options(); track option.value) {
        <button
          type="button"
          class="flex items-center gap-2.5 rounded-control px-2.5 py-2 text-start text-sm text-text transition-colors hover:bg-hover focus-visible:focus-ring aria-pressed:bg-brand-soft aria-pressed:font-semibold aria-pressed:text-brand-text"
          [attr.aria-pressed]="option.value === current()"
          (mousedown)="$event.preventDefault()"
          (click)="selected.emit(option.value)"
        >
          <ng-icon [name]="option.icon" size="1rem" aria-hidden="true" />
          {{ option.label | translate }}
        </button>
      }
    </div>
  `,
})
export class TextEditorOptionMenu<T> {
  readonly options = input.required<readonly TextEditorMenuOption<T>[]>();
  readonly current = input<T>();
  readonly label = input.required<string>();
  readonly selected = output<T>();
}
