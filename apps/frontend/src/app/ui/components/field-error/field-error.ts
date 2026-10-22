import { Component, computed, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { APP_ICONS } from '../../constants/icons';
import type { FieldErrorSource } from '../../types/field-error-source';

@Component({
  selector: 'app-field-error',
  imports: [NgIcon, TranslatePipe],
  providers: [provideIcons(APP_ICONS)],
  template: `
    @if (message(); as message) {
      <p [id]="id()" class="flex items-center gap-1.5 text-xs font-medium text-danger-text">
        <ng-icon name="lucideCircleAlert" size="0.875rem" class="shrink-0" aria-hidden="true" />
        {{ message | translate }}
      </p>
    }
  `,
})
export class FieldError {
  readonly state = input.required<FieldErrorSource>();
  readonly id = input.required<string>();

  protected readonly message = computed(() => {
    const state = this.state();
    return state.touched()
      ? (state.errors().find((error) => error.message)?.message ?? null)
      : null;
  });
}
