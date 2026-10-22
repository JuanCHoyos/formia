import { Component, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';

import { APP_ICONS } from '@/app/ui/constants/icons';
import { AppIcon } from '@/app/ui/types/icons';

@Component({
  selector: 'app-auth-header',
  templateUrl: './auth-header.html',
  imports: [NgIcon],
  providers: [provideIcons(APP_ICONS)],
})
export class AuthHeader {
  eyebrow = input.required<string>();
  title = input.required<string>();
  description = input.required<string>();
  icon = input.required<AppIcon>();
}
