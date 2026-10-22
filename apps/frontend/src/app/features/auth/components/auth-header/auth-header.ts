import { Component, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';

import { APP_ICONS } from '@/app/ui/constants/icons';
import type { AppIcon } from '@/app/ui/types/icons';

@Component({
  selector: 'app-auth-header',
  templateUrl: './auth-header.html',
  imports: [NgIcon],
  providers: [provideIcons(APP_ICONS)],
})
export class AuthHeader {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly icon = input<AppIcon>();
}
