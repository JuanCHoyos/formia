import { NgTemplateOutlet } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { THEME_MODE_OPTIONS } from '@/app/ui/constants/appearance-options';
import { APP_ICONS } from '@/app/ui/constants/icons';
import type { OptionSelection } from '@/app/ui/types/option-selection';

import type { ThemeMode } from '../../../../core/theme/types/theme-mode';

@Component({
  selector: 'app-theme-mode-picker',
  imports: [NgTemplateOutlet, NgIcon, TranslatePipe],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './theme-mode-picker.html',
  styles: `
    .mode-preview[data-scheme='light'] {
      --preview-bg: #f8fafc;
      --preview-surface: #ffffff;
      --preview-border: #e2e8f0;
      --preview-line: #cbd5e1;
    }

    .mode-preview[data-scheme='dark'] {
      --preview-bg: #141414;
      --preview-surface: #1b1b1b;
      --preview-border: #2e2e2e;
      --preview-line: #404040;
    }
  `,
})
export class ThemeModePicker {
  readonly value = input.required<ThemeMode>();
  readonly selectionChange = output<OptionSelection<ThemeMode>>();

  protected readonly options = THEME_MODE_OPTIONS;
}
