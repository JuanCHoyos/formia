import { Component, input } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'app-settings-section',
  template: `
    <section
      class="overflow-hidden rounded-panel border border-border bg-surface shadow-1"
      [attr.aria-labelledby]="titleId"
    >
      <header class="px-4 pt-5 sm:px-6">
        <h2 class="text-h2" [id]="titleId">{{ heading() }}</h2>
        @if (description()) {
          <p class="mt-1 text-sm text-text-2">{{ description() }}</p>
        }
      </header>
      <div class="px-4 py-5 sm:px-6">
        <ng-content />
      </div>
      <ng-content select="[settingsSectionFooter]" />
    </section>
  `,
})
export class SettingsSection {
  readonly heading = input.required<string>();
  readonly description = input<string>();

  protected readonly titleId = `settings-section-${nextId++}`;
}
