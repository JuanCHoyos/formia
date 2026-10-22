import { booleanAttribute, Component, computed, input, model, output, signal } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { InputTextModule } from 'primeng/inputtext';

import { APP_ICONS } from '../../constants/icons';
import type { Strength, StrengthLevel } from '../../types/password-strength';

const PASSWORD_RULES = [
  { id: 'minLength', test: (value: string) => value.length >= 8 },
  { id: 'lowercase', test: (value: string) => /[a-z]/.test(value) },
  { id: 'uppercase', test: (value: string) => /[A-Z]/.test(value) },
  { id: 'number', test: (value: string) => /[0-9]/.test(value) },
  { id: 'symbol', test: (value: string) => /[^a-zA-Z0-9\s]/.test(value) },
  { id: 'noWhitespace', test: (value: string) => /^\S+$/.test(value) },
] as const;

const VERY_STRONG_LENGTH = 12;

const STRENGTH_BAR_CLASS: Record<StrengthLevel, string> = {
  weak: 'bg-danger',
  fair: 'bg-warn',
  strong: 'bg-success',
  veryStrong: 'bg-success',
};

const STRENGTH_TEXT_CLASS: Record<StrengthLevel, string> = {
  weak: 'text-danger-text',
  fair: 'text-warn-text',
  strong: 'text-success-text',
  veryStrong: 'text-success-text',
};

let nextId = 0;

@Component({
  selector: 'app-password',
  imports: [NgIcon, TranslatePipe, InputTextModule],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './password.html',
})
export class Password implements FormValueControl<string> {
  readonly value = model('');
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly touched = input(false);
  readonly touch = output<void>();

  readonly inputId = input(`password-${nextId++}`);
  readonly placeholder = input('');
  readonly autocomplete = input<'current-password' | 'new-password'>('new-password');

  readonly describedBy = input<string>();
  readonly showStrength = input(false, { transform: booleanAttribute });
  readonly customClass = input('');

  protected readonly visible = signal(false);
  protected readonly showsError = computed(() => this.invalid() && this.touched());
  protected readonly strengthId = computed(() => `${this.inputId()}-strength`);
  protected readonly describedByIds = computed(
    () =>
      [this.describedBy(), this.showStrength() ? this.strengthId() : null]
        .filter(Boolean)
        .join(' ') || null,
  );

  protected readonly strength = computed<Strength | null>(() => {
    const value = this.value();
    if (!value) {
      return null;
    }

    const missing = PASSWORD_RULES.filter((rule) => !rule.test(value));
    const passed = PASSWORD_RULES.length - missing.length;
    const missingKey = missing[0] ? `auth.passwordStrength.rules.${missing[0].id}` : null;

    if (!missing.length) {
      return value.length >= VERY_STRONG_LENGTH
        ? { level: 'veryStrong', score: 4, missingKey }
        : { level: 'strong', score: 3, missingKey };
    }

    return passed >= 4
      ? { level: 'fair', score: 2, missingKey }
      : { level: 'weak', score: 1, missingKey };
  });

  protected readonly bars = [1, 2, 3, 4];
  protected readonly barClass = STRENGTH_BAR_CLASS;
  protected readonly textClass = STRENGTH_TEXT_CLASS;

  protected onInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.value.set(event.target.value);
    }
  }
}
