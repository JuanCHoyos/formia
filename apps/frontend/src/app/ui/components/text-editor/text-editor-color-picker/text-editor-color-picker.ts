import { Component, computed, input, output } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import type { BrandName } from '../../../../core/theme/types/brand';
import { TEXT_EDITOR_ICONS } from '../text-editor.constants';

/**
 * One swatch per theme brand (teal, blue…). Swatches use the same `te-*` classes as the content,
 * so they show exactly the color the text gets, in light and dark mode.
 */
@Component({
  selector: 'app-text-editor-color-picker',
  imports: [NgIcon, TranslatePipe],
  providers: [provideIcons(TEXT_EDITOR_ICONS)],
  template: `
    <div class="flex max-w-60 flex-col gap-2" role="group" [attr.aria-label]="label() | translate">
      <p class="text-xs font-semibold text-text-3">{{ label() | translate }}</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          type="button"
          [class]="swatchClass"
          [attr.aria-pressed]="current() === null"
          [attr.aria-label]="'textEditor.colors.none' | translate"
          [attr.title]="'textEditor.colors.none' | translate"
          (mousedown)="$event.preventDefault()"
          (click)="picked.emit(null)"
        >
          <ng-icon name="lucideBan" size="1rem" class="text-text-3" aria-hidden="true" />
        </button>
        @for (brand of colors(); track brand) {
          <button
            type="button"
            [class]="swatchClass"
            [attr.aria-pressed]="current() === brand"
            [attr.aria-label]="'appearance.brand.' + brand | translate"
            [attr.title]="'appearance.brand.' + brand | translate"
            (mousedown)="$event.preventDefault()"
            (click)="picked.emit(brand)"
          >
            @if (kind() === 'text') {
              <span class="text-base leading-none font-bold" [class]="prefix() + brand">A</span>
            } @else {
              <span class="size-5 rounded-sm" [class]="prefix() + brand"></span>
            }
          </button>
        }
      </div>
    </div>
  `,
})
export class TextEditorColorPicker {
  readonly kind = input.required<'background' | 'text'>();
  readonly colors = input.required<readonly BrandName[]>();
  readonly current = input<BrandName | null>(null);
  readonly label = input.required<string>();
  readonly picked = output<BrandName | null>();

  protected readonly prefix = computed(() => (this.kind() === 'text' ? 'te-color-' : 'te-bg-'));
  protected readonly swatchClass =
    'grid size-8 place-items-center rounded-control border border-border bg-surface transition-colors hover:border-border-hover focus-visible:focus-ring aria-pressed:border-brand aria-pressed:ring-1 aria-pressed:ring-brand';
}
