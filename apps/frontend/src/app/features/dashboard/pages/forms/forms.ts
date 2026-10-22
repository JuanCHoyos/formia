import { Component, computed, inject, resource, signal } from '@angular/core';
import { Router } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { ulid } from 'ulid';

import { apiClient } from '@/app/core/api/api-client';
import { apiResult } from '@/app/core/api/api-result';
import { Button } from '@/app/ui/components/button/button';
import { SegmentedControl } from '@/app/ui/components/segmented-control/segmented-control';
import { APP_ICONS } from '@/app/ui/constants/icons';
import type { SegmentedControlOption } from '@/app/ui/types/segmented-control-option';
import { normalizeSearchText } from '@/app/ui/utils/search.utils';

import { FormListItem } from '../../components/form-list-item/form-list-item';
import { FormsStats } from '../../components/forms-stats/forms-stats';
import type { FormStatusFilter } from '../../types/form-summary';

@Component({
  selector: 'app-forms',
  imports: [
    NgIcon,
    TranslatePipe,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SkeletonModule,
    Button,
    SegmentedControl,
    FormListItem,
    FormsStats,
  ],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './forms.html',
})
export class Forms {
  private readonly router = inject(Router);

  protected readonly formsResource = resource({
    loader: async () => {
      const result = await apiResult(apiClient.forms.get());

      if (result.isError()) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
  });

  protected readonly forms = computed(() =>
    this.formsResource.hasValue()
      ? [...this.formsResource.value()].sort((a, b) => b.createdAt - a.createdAt)
      : [],
  );

  protected readonly search = signal('');
  protected readonly statusFilter = signal<FormStatusFilter>('all');
  protected readonly statusOptions: readonly SegmentedControlOption<FormStatusFilter>[] = [
    { value: 'all', labelKey: 'dashboard.filter.all' },
    { value: 'published', labelKey: 'common.status.published' },
    { value: 'draft', labelKey: 'common.status.draft' },
  ];

  protected readonly visibleForms = computed(() => {
    const query = normalizeSearchText(this.search());
    const status = this.statusFilter();

    return this.forms().filter(
      (form) =>
        (status === 'all' || form.status === status) &&
        (!query || normalizeSearchText(form.title).includes(query)),
    );
  });

  protected readonly skeletonRows = Array.from({ length: 5 }, (_, index) => index);

  protected updateSearch(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.search.set(event.target.value);
    }
  }

  /** The form is persisted by the builder the first time it opens an id that doesn't exist. */
  protected createForm(): void {
    void this.router.navigate(['/form/builder', ulid()]);
  }
}
