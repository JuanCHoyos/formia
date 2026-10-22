import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

const DEFAULT_COOLDOWN_SECONDS = 60;

@Component({
  selector: 'app-resend-code',
  imports: [TranslatePipe],
  template: `
    <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-2" aria-live="polite">
      {{ 'auth.resendCode.prompt' | translate }}
      @if (remaining() > 0) {
        <span class="tabular-nums text-text-3">
          {{ 'auth.resendCode.wait' | translate: { time: countdown() } }}
        </span>
      } @else {
        <button
          type="button"
          class="rounded-sm font-semibold text-brand-text hover:underline focus-visible:focus-ring disabled:opacity-60"
          [disabled]="isSending()"
          (click)="resend()"
        >
          {{ (isSending() ? 'auth.resendCode.sending' : 'auth.resendCode.action') | translate }}
        </button>
      }
    </p>
  `,
})
export class ResendCode implements OnInit {
  readonly send = input.required<() => Promise<boolean>>();
  readonly cooldownSeconds = input(DEFAULT_COOLDOWN_SECONDS);

  protected readonly remaining = signal(0);
  protected readonly isSending = signal(false);
  protected readonly countdown = computed(() => {
    const seconds = this.remaining();
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });

  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.timer));
  }

  ngOnInit(): void {
    this.startCooldown();
  }

  protected async resend(): Promise<void> {
    if (this.remaining() > 0 || this.isSending()) {
      return;
    }

    this.isSending.set(true);
    try {
      if (await this.send()()) {
        this.startCooldown();
      }
    } finally {
      this.isSending.set(false);
    }
  }

  private startCooldown(): void {
    clearInterval(this.timer);
    this.remaining.set(this.cooldownSeconds());
    this.timer = setInterval(() => {
      this.remaining.update((seconds) => Math.max(0, seconds - 1));
      if (this.remaining() === 0) {
        clearInterval(this.timer);
      }
    }, 1000);
  }
}
