import { Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { InputOtpModule } from 'primeng/inputotp';
import { InputTextModule } from 'primeng/inputtext';

import { AuthApi } from '@/app/core/auth/auth-api';
import { getCognitoErrorNotification } from '@/app/core/auth/cognito-error-notifications';
import { isCognitoPasswordValid } from '@/app/core/auth/password-policy';
import { AuthHeader } from '@/app/features/auth/components/auth-header/auth-header';
import { AuthSteps } from '@/app/features/auth/components/auth-steps/auth-steps';
import { ResendCode } from '@/app/features/auth/components/resend-code/resend-code';
import { Button } from '@/app/ui/components/button/button';
import { FieldError } from '@/app/ui/components/field-error/field-error';
import { Password } from '@/app/ui/components/password/password';
import { APP_ICONS } from '@/app/ui/constants/icons';
import { Notifications } from '@/app/ui/services/notifications';

@Component({
  selector: 'app-forgot-password',
  imports: [
    RouterLink,
    FormField,
    Button,
    Password,
    InputOtpModule,
    InputTextModule,
    NgIcon,
    AuthHeader,
    AuthSteps,
    FieldError,
    ResendCode,
    TranslatePipe,
  ],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly notifications = inject(Notifications);

  readonly isSubmitting = signal(false);
  readonly step = signal<1 | 2>(1);
  readonly reset = signal({
    email: '',
    code: '',
    password: '',
    confirmPassword: '',
  });

  readonly emailForm = form(this.reset, (path) => {
    required(path.email, { message: 'auth.validation.emailRequired' });
    email(path.email, { message: 'auth.validation.emailInvalid' });
  });

  readonly resetForm = form(this.reset, (path) => {
    required(path.code);
    minLength(path.code, 6);
    required(path.password, { message: 'auth.validation.passwordRequired' });
    validate(path.password, ({ value }) =>
      !value() || isCognitoPasswordValid(value())
        ? null
        : { kind: 'password-policy', message: 'auth.validation.passwordPolicy' },
    );
    required(path.confirmPassword, { message: 'auth.validation.confirmPasswordRequired' });
    validate(path.confirmPassword, ({ value }) =>
      !value() || value() === this.reset().password
        ? null
        : { kind: 'mismatch', message: 'auth.validation.passwordsDoNotMatch' },
    );
  });

  readonly passwordsMatch = computed(() => {
    const { password, confirmPassword } = this.reset();
    return confirmPassword.length > 0 && confirmPassword === password;
  });

  readonly resendCode = async (): Promise<boolean> => {
    try {
      await this.authApi.forgotPassword({ email: this.reset().email });
      this.notifications.success(
        'auth.notifications.resetCodeSent.title',
        'auth.notifications.resetCodeSent.detail',
      );
      return true;
    } catch (error) {
      const notification = getCognitoErrorNotification(error, 'passwordRecovery');
      this.notifications.error(notification.summaryKey, notification.detailKey);
      return false;
    }
  };

  async requestCode(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) {
      return;
    }
    if (this.emailForm().invalid()) {
      this.notifications.error(
        'auth.validation.invalidForm.title',
        'auth.validation.invalidForm.detail',
      );
      return;
    }

    this.isSubmitting.set(true);
    try {
      await this.authApi.forgotPassword({ email: this.reset().email });
      this.step.set(2);
      this.notifications.success(
        'auth.notifications.resetCodeSent.title',
        'auth.notifications.resetCodeSent.detail',
      );
    } catch (error) {
      const notification = getCognitoErrorNotification(error, 'passwordRecovery');
      this.notifications.error(notification.summaryKey, notification.detailKey);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async resetPassword(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) {
      return;
    }
    if (this.resetForm().invalid()) {
      this.notifications.error(
        'auth.validation.invalidForm.title',
        'auth.validation.invalidForm.detail',
      );
      return;
    }

    this.isSubmitting.set(true);
    try {
      const { email, code, password } = this.reset();
      await this.authApi.confirmForgotPassword({
        email,
        code,
        newPassword: password,
      });
      this.notifications.success(
        'auth.notifications.passwordReset.title',
        'auth.notifications.passwordReset.detail',
      );
      await this.router.navigateByUrl('/auth/login');
    } catch (error) {
      const notification = getCognitoErrorNotification(error, 'passwordRecovery');
      this.notifications.error(notification.summaryKey, notification.detailKey);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
