import { Component, inject } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { TagModule } from 'primeng/tag';

import { ThemePreferences } from '@/app/core/theme/theme-preferences';
import { transitionOriginOf } from '@/app/core/theme/view-transition';
import { Button } from '@/app/ui/components/button/button';
import type { OptionSelection } from '@/app/ui/types/option-selection';

import type { BrandName } from '../../../../core/theme/types/brand';
import type { ThemeMode } from '../../../../core/theme/types/theme-mode';
import { BrandColorPicker } from '../../components/brand-color-picker/brand-color-picker';
import { SettingsSection } from '../../components/settings-section/settings-section';
import { ThemeModePicker } from '../../components/theme-mode-picker/theme-mode-picker';

@Component({
  selector: 'app-appearance-settings',
  imports: [TranslatePipe, TagModule, Button, BrandColorPicker, SettingsSection, ThemeModePicker],
  templateUrl: './appearance-settings.html',
})
export class AppearanceSettings {
  protected readonly theme = inject(ThemePreferences);

  protected setMode({ value, element }: OptionSelection<ThemeMode>): void {
    this.theme.setMode(value, transitionOriginOf(element));
  }

  protected setBrand({ value, element }: OptionSelection<BrandName>): void {
    this.theme.setBrand(value, transitionOriginOf(element));
  }
}
