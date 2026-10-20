import { Button } from '@/app/ui/components/button/button';
import { Password } from '@/app/ui/components/password/password';
import { AuthHeader } from '@/app/features/auth/components/auth-header/auth-header';
import { SocialLoginButtons } from '@/app/features/auth/components/social-login-buttons/social-login-buttons';
import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';

import { Router, RouterLink } from '@angular/router';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthApi } from '@/app/core/auth/auth-api';
import { Notifications } from '@/app/ui/services/notifications';
import { getCognitoErrorNotification } from '@/app/core/auth/cognito-error-notifications';


@Component({
  selector: 'app-login',
  imports: [RouterLink, FormField, Button, Password, InputTextModule, DividerModule, AuthHeader, SocialLoginButtons, TranslatePipe],
  templateUrl: './login.html',
})
export class Login {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly notifications = inject(Notifications);
  readonly isSubmitting = signal(false);

  readonly login = signal<{ email: string; password: string }>({ email: '', password: '' });
  readonly loginForm = form(this.login, (path) => {
    email(path.email);
    required(path.email);
    required(path.password);
  },);

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) {
      return;
    }
    if (this.loginForm().invalid()) {
      this.notifications.error(
        'auth.validation.invalidForm.title',
        'auth.validation.invalidForm.detail',
      );
      return;
    }

    this.isSubmitting.set(true);
    try {
      const user = this.login();
      const response = await this.authApi.signIn(user);
      if (response.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        this.notifications.info(
          'auth.notifications.confirmationRequired.title',
          'auth.notifications.confirmationRequired.detail',
        );
        await this.router.navigateByUrl(`/auth/confirm-signup/${user.email}`);
        return;
      }
      this.notifications.success(
        'auth.notifications.signedIn.title',
        'auth.notifications.signedIn.detail',
      );
      await this.router.navigateByUrl('/dashboard/forms');
    } catch (error) {
      const notification = getCognitoErrorNotification(error);
      this.notifications.error(notification.summaryKey, notification.detailKey);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
