import { Component, computed, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { APP_ICONS } from '@/app/ui/constants/icons';

import type { FormStat } from '../../types/form-stat';
import type { FormSummary } from '../../types/form-summary';

@Component({
  selector: 'app-forms-stats',
  imports: [NgIcon, TranslatePipe],
  providers: [provideIcons(APP_ICONS)],
  template: `
    <ul class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      @for (stat of stats(); track stat.labelKey) {
        <li class="flex flex-col gap-3 rounded-panel border border-border bg-surface p-4 shadow-1">
          <span
            class="flex size-8 min-w-8 min-h-8 items-center justify-center rounded-lg bg-brand-soft text-brand-text"
            aria-hidden="true"
          >
            <ng-icon [name]="stat.icon" size="1rem" />
          </span>
          <span class="flex flex-col">
            <span class="text-2xl font-semibold tracking-[-0.02em] tabular-nums">{{
              stat.value
            }}</span>
            <span class="text-xs font-medium text-text-3">{{ stat.labelKey | translate }}</span>
          </span>
        </li>
      }
    </ul>
  `,
})
export class FormsStats {
  readonly forms = input.required<readonly FormSummary[]>();

  protected readonly stats = computed<FormStat[]>(() => {
    const forms = this.forms();
    const count = (predicate: (form: FormSummary) => boolean) => forms.filter(predicate).length;

    return [
      { labelKey: 'dashboard.stats.total', icon: 'lucideFiles', value: forms.length },
      {
        labelKey: 'dashboard.stats.published',
        icon: 'lucideCircleCheck',
        value: count((form) => form.status === 'published'),
      },
      {
        labelKey: 'dashboard.stats.drafts',
        icon: 'lucidePencil',
        value: count((form) => form.status === 'draft'),
      },
      {
        labelKey: 'dashboard.stats.public',
        icon: 'lucideEye',
        value: count((form) => form.isPublic),
      },
    ];
  });
}
