import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Home } from '@primeicons/angular/home';
import { Sidebar as SidebarIcon } from '@primeicons/angular/sidebar';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import { UserStore } from '@/app/core/auth/user-store';

const MOBILE_QUERY = '(max-width: 1023px)';

@Component({
  selector: 'app-dashboard-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    AvatarModule,
    ButtonModule,
    SidebarModule,
    Home,
    SidebarIcon,
  ],
  templateUrl: './dashboard-layout.html',
})
export class DashboardLayout {
  protected readonly userStore = inject(UserStore);

  protected readonly isMobile = signal(false);
  protected readonly open = signal(true);

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
}
