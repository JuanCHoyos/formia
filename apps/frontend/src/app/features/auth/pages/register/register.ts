import { Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, required, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { InputTextModule } from 'primeng/inputtext';

import type { SignUpInput } from '@formly/core/schemas/auth';

import { AuthApi } from '@/app/core/auth/auth-api';
import { getCognitoErrorNotification } from '@/app/core/auth/cognito-error-notifications';
import { isCognitoPasswordValid } from '@/app/core/auth/password-policy';
import { AuthHeader } from '@/app/features/auth/components/auth-header/auth-header';
import { AuthSteps } from '@/app/features/auth/components/auth-steps/auth-steps';
import { Button } from '@/app/ui/components/button/button';
import { FieldError } from '@/app/ui/components/field-error/field-error';
import { Password } from '@/app/ui/components/password/password';
import { APP_ICONS } from '@/app/ui/constants/icons';
import { Notifications } from '@/app/ui/services/notifications';

@Component({
  selector: 'app-register',
  imports: [
    RouterLink,
    FormField,
    Button,
    Password,
    NgIcon,
    InputTextModule,
    AuthHeader,
    AuthSteps,
    FieldError,
    TranslatePipe,
  ],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './register.html',
})
export class Register {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly notifications = inject(Notifications);
  isSubmitting = signal(false);

  register = signal<SignUpInput>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });

  registerForm = form(this.register, (path) => {
    required(path.name, { message: 'auth.validation.nameRequired' });
    validate(path.name, ({ value }) =>
      !value() || value().trim().length >= 3
        ? null
        : { kind: 'minLength', message: 'auth.validation.nameTooShort' },
    );
    required(path.email, { message: 'auth.validation.emailRequired' });
    email(path.email, { message: 'auth.validation.emailInvalid' });
    required(path.password, { message: 'auth.validation.passwordRequired' });
    validate(path.password, ({ value }) =>
      !value() || isCognitoPasswordValid(value())
        ? null
        : { kind: 'password-policy', message: 'auth.validation.passwordPolicy' },
    );
    required(path.confirmPassword, { message: 'auth.validation.confirmPasswordRequired' });
    validate(path.confirmPassword, ({ value }) =>
      !value() || value() === this.register().password
        ? null
        : { kind: 'mismatch', message: 'auth.validation.passwordsDoNotMatch' },
    );
  });

  readonly passwordsMatch = computed(() => {
    const { password, confirmPassword } = this.register();
    return confirmPassword.length > 0 && confirmPassword === password;
  });

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) {
      return;
    }
    if (this.registerForm().invalid()) {
      this.notifications.error(
        'auth.validation.invalidForm.title',
        'auth.validation.invalidForm.detail',
      );
      return;
    }

    this.isSubmitting.set(true);

    try {
      const response = await this.authApi.signUpWithEmail(this.register());
      if (response.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        this.notifications.success(
          'auth.notifications.confirmationCodeSent.title',
          'auth.notifications.confirmationCodeSent.detail',
        );
        await this.router.navigate(['/auth/confirm-signup', this.register().email]);
        return;
      }

      this.notifications.success(
        'auth.notifications.accountCreated.title',
        'auth.notifications.accountCreated.detail',
      );
      await this.router.navigateByUrl('/auth/login');
    } catch (error) {
      const notification = getCognitoErrorNotification(error);
      this.notifications.error(notification.summaryKey, notification.detailKey);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
