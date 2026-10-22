import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { APP_ICONS } from '@/app/ui/constants/icons';

import type { SettingsNavItem } from '../types/settings-nav-item';

@Component({
  selector: 'app-settings-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon, TranslatePipe],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './settings-layout.html',
})
export class SettingsLayout {
  protected readonly navItems: readonly SettingsNavItem[] = [
    { labelKey: 'settings.nav.profile', icon: 'lucideUser', route: 'profile' },
    { labelKey: 'settings.nav.appearance', icon: 'lucidePalette', route: 'appearance' },
  ];
}
