import { Button } from '@/app/ui/components/button/button';
import { Password } from '@/app/ui/components/password/password';
import { AuthHeader } from '@/app/features/auth/components/auth-header/auth-header';
import { AuthApi } from '@/app/core/auth/auth-api';
import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, required, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TranslatePipe } from '@ngx-translate/core';
import type { SignUpInput } from '@formly/core/schemas/auth';
import { isCognitoPasswordValid } from '@/app/core/auth/password-policy';
import { Notifications } from '@/app/ui/services/notifications';
import { getCognitoErrorNotification } from '@/app/core/auth/cognito-error-notifications';

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormField, Button, Password, InputTextModule, SelectModule, CheckboxModule, MessageModule, AuthHeader, TranslatePipe],
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
    email(path.email);
    required(path.email);
    required(path.name);
    validate(path.name, ({ value }) =>
      value().length >= 3
        ? null
        : { kind: 'minLength', message: 'auth.validation.invalidForm.detail' },
    );
    required(path.password);
    required(path.confirmPassword);
    validate(path.password, ({ value }) =>
      isCognitoPasswordValid(value())
        ? null
        : { kind: 'password-policy', message: 'auth.validation.passwordPolicy' },
    );
    validate(path.confirmPassword, ({ value }) => {
      const password = this.register().password;
      return value() === password
        ? null
        : { kind: 'mismatch', message: 'auth.validation.passwordsDoNotMatch' };
    });
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
