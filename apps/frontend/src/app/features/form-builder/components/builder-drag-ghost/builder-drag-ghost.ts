import { Component, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';

import { APP_ICONS } from '@/app/ui/constants/icons';
import type { AppIcon } from '@/app/ui/types/icons';

@Component({
  selector: 'app-builder-drag-ghost',
  imports: [NgIcon],
  providers: [provideIcons(APP_ICONS)],
  host: {
    class:
      'flex min-w-56 items-center gap-2.5 rounded-menu border border-brand bg-surface-raised px-3 py-2 text-[13px] font-semibold text-text shadow-3 -rotate-2',
  },
  template: `
    <span
      class="grid size-7 min-h-7 min-w-7 place-items-center rounded-lg border border-brand-bd bg-brand-soft text-brand-text"
    >
      <ng-icon [name]="icon()" size="1rem" />
    </span>
    {{ label() }}
    <ng-icon
      name="lucideMousePointer2"
      size="1rem"
      class="ml-auto min-h-4 min-w-4 shrink-0 text-text-2"
    />
  `,
})
export class BuilderDragGhost {
  readonly icon = input.required<AppIcon>();
  readonly label = input.required<string>();
}
