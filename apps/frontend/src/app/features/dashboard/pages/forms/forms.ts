import { DatePipe } from '@angular/common';
import { Component, computed, inject, resource } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ulid } from 'ulid';

import { apiClient } from '@/app/core/api/api-client';
import { apiResult } from '@/app/core/api/api-result';
import { Button } from '@/app/ui/components/button/button';

@Component({
  selector: 'app-forms',
  imports: [DatePipe, RouterLink, TranslatePipe, TableModule, SkeletonModule, Button],
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

  protected readonly skeletonRows = Array.from({ length: 5 }, (_, index) => index);

  /** The form is persisted by the builder the first time it opens an id that doesn't exist. */
  protected createForm(): void {
    void this.router.navigate(['/form/builder', ulid()]);
  }
}
