import { booleanAttribute, Component, input } from '@angular/core';

@Component({
  selector: 'app-brand-logo',
  host: { class: 'inline-flex items-center gap-2.5' },
  template: `
    <span
      class="grid size-8 shrink-0 place-items-center rounded-lg text-brand"
      [class]="inverse() ? 'bg-white' : 'bg-brand'"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" class="size-5">
        <path
          d="M7 2.5h7.3L19 7.2V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V4a1.5 1.5 0 0 1 1-1.5z"
          [attr.fill]="inverse() ? 'currentColor' : '#fff'"
        />
        <path
          d="M14.3 2.5V6a1.2 1.2 0 0 0 1.2 1.2H19"
          fill="none"
          [attr.stroke]="inverse() ? '#fff' : 'currentColor'"
          stroke-width="1.5"
          stroke-linejoin="round"
          opacity=".55"
        />
        <path
          d="m9.2 13.8 2.1 2.1 4.2-4.4"
          fill="none"
          [attr.stroke]="inverse() ? '#fff' : 'currentColor'"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    @if (wordmark()) {
      <span class="text-[17px] font-bold tracking-[-0.03em]">Pliego</span>
    }
  `,
})
export class BrandLogo {
  readonly inverse = input(false, { transform: booleanAttribute });
  readonly wordmark = input(true, { transform: booleanAttribute });
}
