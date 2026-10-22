import { Component, computed, input } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-steps',
  imports: [TranslatePipe],
  template: `
    <div class="flex items-center gap-2">
      <span class="flex gap-1.5" aria-hidden="true">
        @for (step of steps(); track step) {
          <span
            class="h-1 w-8 rounded-full transition-colors duration-300"
            [class]="step <= current() ? 'bg-brand' : 'bg-viz-track'"
          ></span>
        }
      </span>
      <p class="ml-1 text-xs font-medium text-text-2">
        {{ 'auth.steps.progress' | translate: { current: current(), total: total() } }}
        @if (labelKey(); as labelKey) {
          <span class="text-text-3">· {{ labelKey | translate }}</span>
        }
      </p>
    </div>
  `,
})
export class AuthSteps {
  readonly current = input.required<number>();
  readonly total = input.required<number>();
  readonly labelKey = input<string>();

  protected readonly steps = computed(() =>
    Array.from({ length: this.total() }, (_, index) => index + 1),
  );
}
