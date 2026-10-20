import { Component, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputPasswordModule } from 'primeng/inputpassword';

import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Eye } from '@primeicons/angular/eye';
import { EyeSlash } from '@primeicons/angular/eye-slash';


import { Check } from '@primeicons/angular/check';
import { Times } from '@primeicons/angular/times';

import { ulid } from 'ulid';
import { form, FormField, disabled as disableField } from '@angular/forms/signals';
import { PopoverModule } from 'primeng/popover';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TranslatePipe } from '@ngx-translate/core';

const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 256,
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  number: /[0-9]/,
  symbol: /[^a-zA-Z0-9\s]/,
  noWhitespace: /^\S+$/,
};


@Component({
  imports: [CommonModule, FormField, InputPasswordModule, DividerModule, IconFieldModule, InputIconModule, PopoverModule, ProgressBarModule, TagModule, TranslatePipe, Eye, EyeSlash, Check, Times],
  selector: 'app-password',
  templateUrl: './password.html',
})
export class Password {
  mask = model<boolean>(true);
  readonly required = input<boolean>(false);
  readonly inputId = input<string>(ulid());
  readonly customClass = input<string>('');
  readonly placeholder = input<string>('');

  readonly value = model<string>('');
  readonly disabled = input<boolean>(false);
  readonly touch = output<void>();

  readonly passwordForm = form(this.value, (path) => {
    disableField(path, { when: () => this.disabled() });
  });


  readonly rules = signal([
    { id: 'minLength', label: 'auth.passwordStrength.rules.minLength', test: (v: string) => v.length >= PASSWORD_POLICY.minLength },
    { id: 'lowercase', label: 'auth.passwordStrength.rules.lowercase', test: (v: string) => PASSWORD_POLICY.lowercase.test(v) },
    { id: 'uppercase', label: 'auth.passwordStrength.rules.uppercase', test: (v: string) => PASSWORD_POLICY.uppercase.test(v) },
    { id: 'number', label: 'auth.passwordStrength.rules.number', test: (v: string) => PASSWORD_POLICY.number.test(v) },
    { id: 'symbol', label: 'auth.passwordStrength.rules.symbol', test: (v: string) => PASSWORD_POLICY.symbol.test(v) },
    { id: 'noWhitespace', label: 'auth.passwordStrength.rules.noWhitespace', test: (v: string) => PASSWORD_POLICY.noWhitespace.test(v) },
  ]);
}
