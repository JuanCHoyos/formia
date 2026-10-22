import { Component, input, output } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { BRAND_OPTIONS } from '@/app/ui/constants/appearance-options';
import { APP_ICONS } from '@/app/ui/constants/icons';
import type { OptionSelection } from '@/app/ui/types/option-selection';

import type { BrandName } from '../../../../core/theme/types/brand';

@Component({
  selector: 'app-brand-color-picker',
  imports: [NgIcon, TranslatePipe],
  providers: [provideIcons(APP_ICONS)],
  template: `
    <div
      role="radiogroup"
      class="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap sm:gap-4"
      [attr.aria-label]="'appearance.brand.label' | translate"
    >
      @for (option of options; track option.brand) {
        <label
          #item
          class="group flex cursor-pointer flex-col items-center gap-2 rounded-menu p-1.5 has-focus-visible:focus-ring sm:w-18"
          [style.--swatch]="option.swatch"
        >
          <input
            type="radio"
            name="brand-color"
            class="sr-only"
            [checked]="option.brand === value()"
            (change)="selectionChange.emit({ value: option.brand, element: item })"
          />
          <span
            class="flex size-10 items-center justify-center rounded-full bg-(--swatch) text-white shadow-1 outline-2 outline-offset-2 outline-transparent transition-[outline-color,transform] duration-150 group-hover:scale-105 group-has-checked:outline-(--swatch)"
            aria-hidden="true"
          >
            <ng-icon
              name="lucideCheck"
              size="1.125rem"
              class="scale-50 opacity-0 transition-[opacity,transform] duration-150 group-has-checked:scale-100 group-has-checked:opacity-100"
            />
          </span>
          <span class="text-xs font-medium text-text-2 group-has-checked:text-text">
            {{ option.labelKey | translate }}
          </span>
        </label>
      }
    </div>
  `,
})
export class BrandColorPicker {
  readonly value = input.required<BrandName>();
  readonly selectionChange = output<OptionSelection<BrandName>>();

  protected readonly options = BRAND_OPTIONS;
}
