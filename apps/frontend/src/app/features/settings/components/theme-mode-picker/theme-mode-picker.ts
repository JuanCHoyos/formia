import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { PreviewCardSelector } from '@/app/ui/components/preview-card-selector/preview-card-selector';
import { PreviewCardTemplate } from '@/app/ui/components/preview-card-selector/preview-card-template';
import { THEME_MODE_OPTIONS } from '@/app/ui/constants/appearance-options';
import type { OptionSelection } from '@/app/ui/types/option-selection';
import type { PreviewCardSelectorOption } from '@/app/ui/types/preview-card-selector-option';

import type { ThemeMode } from '../../../../core/theme/types/theme-mode';

@Component({
  selector: 'app-theme-mode-picker',
  imports: [NgTemplateOutlet, TranslatePipe, PreviewCardSelector, PreviewCardTemplate],
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
  private readonly translate = inject(TranslateService);

  readonly value = input.required<ThemeMode>();
  readonly selectionChange = output<OptionSelection<ThemeMode>>();

  protected readonly options = computed<PreviewCardSelectorOption<ThemeMode>[]>(() => {
    this.translate.currentLang();
    return THEME_MODE_OPTIONS.map((option) => ({
      value: option.value,
      icon: option.icon,
      label: this.translate.instant(option.labelKey) as string,
    }));
  });
}
