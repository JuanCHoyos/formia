import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { BrandLogo } from '@/app/ui/components/brand-logo/brand-logo';
import { APP_ICONS } from '@/app/ui/constants/icons';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, NgIcon, TranslatePipe, BrandLogo],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './auth-layout.html',
  styles: `
    .brand-dots {
      background-image: radial-gradient(rgb(255 255 255 / 0.16) 1px, transparent 1px);
      background-size: 22px 22px;
    }
  `,
})
export class AuthLayout {
  protected readonly chartBars = [30, 45, 38, 60, 42, 55, 70, 64, 82, 58, 90, 76];
}
