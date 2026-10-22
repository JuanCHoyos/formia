import { Component, computed, inject, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { AvatarModule } from 'primeng/avatar';
import { Popover, PopoverModule } from 'primeng/popover';
import { SidebarModule } from 'primeng/sidebar';

import { AuthApi } from '@/app/core/auth/auth-api';
import { UserStore } from '@/app/core/auth/user-store';
import { ThemePreferences } from '@/app/core/theme/theme-preferences';
import { transitionOriginOf } from '@/app/core/theme/view-transition';
import { SegmentedControl } from '@/app/ui/components/segmented-control/segmented-control';
import { THEME_MODE_OPTIONS } from '@/app/ui/constants/appearance-options';
import { APP_ICONS } from '@/app/ui/constants/icons';
import { Notifications } from '@/app/ui/services/notifications';
import type { OptionSelection } from '@/app/ui/types/option-selection';

import type { ThemeMode } from '../../../../core/theme/types/theme-mode';
import type { UserMenuLink } from '../../types/navigation';

@Component({
  selector: 'app-user-menu',
  imports: [
    RouterLink,
    NgIcon,
    TranslatePipe,
    AvatarModule,
    PopoverModule,
    SidebarModule,
    SegmentedControl,
  ],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './user-menu.html',
})
export class UserMenu {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly notifications = inject(Notifications);
  protected readonly userStore = inject(UserStore);
  protected readonly theme = inject(ThemePreferences);

  protected readonly themeModes = THEME_MODE_OPTIONS.map(({ value, labelKey }) => ({
    value,
    labelKey,
  }));
  protected readonly links: readonly UserMenuLink[] = [
    { labelKey: 'userMenu.profile', icon: 'lucideUser', route: '/dashboard/settings/profile' },
    {
      labelKey: 'userMenu.appearance',
      icon: 'lucidePalette',
      route: '/dashboard/settings/appearance',
    },
  ];

  readonly navigated = output<void>();

  protected readonly isOpen = signal(false);
  protected readonly isSigningOut = signal(false);
  protected readonly name = computed(() => this.userStore.user()?.fullName ?? '');
  protected readonly email = computed(() => this.userStore.user()?.email ?? '');

  protected setMode({ value, element }: OptionSelection<ThemeMode>): void {
    this.theme.setMode(value, transitionOriginOf(element));
  }

  protected followLink(popover: Popover): void {
    popover.hide();
    this.navigated.emit();
  }

  protected confirmSignOut(popover: Popover): void {
    popover.hide();
    this.notifications.confirmDestructive({
      titleKey: 'userMenu.signOutConfirm.title',
      messageKey: 'userMenu.signOutConfirm.message',
      acceptLabelKey: 'userMenu.signOut',
      accept: () => void this.signOut(),
    });
  }

  private async signOut(): Promise<void> {
    if (this.isSigningOut()) {
      return;
    }

    this.isSigningOut.set(true);
    try {
      await this.authApi.signOut();
      this.userStore.clear();
      await this.router.navigateByUrl('/auth/login');
    } catch {
      this.notifications.error('userMenu.signOutError.title', 'userMenu.signOutError.detail');
    } finally {
      this.isSigningOut.set(false);
    }
  }
}
