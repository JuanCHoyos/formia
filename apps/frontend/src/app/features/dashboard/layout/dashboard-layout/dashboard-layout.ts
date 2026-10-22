import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Sidebar as SidebarIcon } from '@primeicons/angular/sidebar';

import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import { TooltipModule } from 'primeng/tooltip';

import { UserMenu } from '@/app/features/dashboard/components/user-menu/user-menu';
import { BrandLogo } from '@/app/ui/components/brand-logo/brand-logo';
import { APP_ICONS } from '@/app/ui/constants/icons';

import type { NavGroup } from '../../types/navigation';

const MOBILE_QUERY = '(max-width: 1023px)';

@Component({
  selector: 'app-dashboard-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgIcon,
    TranslatePipe,
    ButtonModule,
    SidebarModule,
    TooltipModule,
    SidebarIcon,
    UserMenu,
    BrandLogo,
  ],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './dashboard-layout.html',
})
export class DashboardLayout {
  protected readonly isMobile = signal(false);
  protected readonly open = signal(true);
  protected readonly isCollapsed = computed(() => !this.isMobile() && !this.open());

  protected readonly navGroups: readonly NavGroup[] = [
    {
      labelKey: 'dashboard.nav.workspace',
      items: [
        { labelKey: 'dashboard.nav.forms', icon: 'lucideFileText', route: '/dashboard/forms' },
        { labelKey: 'dashboard.nav.responses', icon: 'lucideInbox' },
        { labelKey: 'dashboard.nav.analytics', icon: 'lucideChartColumn' },
      ],
    },
    {
      labelKey: 'dashboard.nav.participation',
      items: [{ labelKey: 'dashboard.nav.answered', icon: 'lucideMessageSquareText' }],
    },
  ];

  constructor() {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const apply = (matches: boolean) => {
      this.isMobile.set(matches);
      this.open.set(!matches);
    };
    const onChange = (event: MediaQueryListEvent) => apply(event.matches);

    apply(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => mediaQuery.removeEventListener('change', onChange));
  }

  protected closeOnMobile(): void {
    if (this.isMobile()) {
      this.open.set(false);
    }
  }
}
