import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { TagModule } from 'primeng/tag';

import { APP_ICONS } from '@/app/ui/constants/icons';

import type { FormSummary } from '../../types/form-summary';

@Component({
  selector: 'app-form-list-item',
  imports: [DatePipe, RouterLink, NgIcon, TranslatePipe, TagModule],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './form-list-item.html',
})
export class FormListItem {
  readonly form = input.required<FormSummary>();
}
