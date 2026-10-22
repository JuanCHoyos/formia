import { Button } from '@/app/ui/components/button/button';
import { AuthHeader } from '@/app/features/auth/components/auth-header/auth-header';
import { Component, inject, input, signal } from '@angular/core';
import { form, required, FormField, validate, minLength } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { InputOtpModule } from 'primeng/inputotp';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthApi } from '@/app/core/auth/auth-api';
import { Notifications } from '@/app/ui/services/notifications';
import { getCognitoErrorNotification } from '@/app/core/auth/cognito-error-notifications';


@Component({
  selector: 'app-confirm-signup',
  imports: [RouterLink, InputOtpModule, FormField, Button, AuthHeader, TranslatePipe],
  templateUrl: './confirm-signup.html',
})
export class ConfirmSignup {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly notifications = inject(Notifications);

  email = input.required<string>();

  readonly isSubmitting = signal(false);
  code = signal<string>('');

  codeForm = form(this.code, (path) => {
    required(path);
    minLength(path, 6);
  });

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) return;
  
    if (this.codeForm().invalid()) {
      return this.notifications.error(
        'auth.validation.invalidForm.title',
        'auth.validation.invalidForm.detail',
      );
    }

    this.isSubmitting.set(true);
    try {
      await this.authApi.confirmSignUpWithEmail({ email: this.email(), code: this.code() });
      this.notifications.success(
        'auth.notifications.accountConfirmed.title',
        'auth.notifications.accountConfirmed.detail',
      );
      await this.router.navigateByUrl('/auth/login');
    } catch (error) {
      const notification = getCognitoErrorNotification(error, 'signUpConfirmation');
      this.notifications.error(notification.summaryKey, notification.detailKey);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
