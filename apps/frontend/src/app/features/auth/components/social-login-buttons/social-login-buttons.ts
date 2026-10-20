import { Button } from '@/app/ui/components/button/button';
import { AuthApi } from '@/app/core/auth/auth-api';
import type { ExternalAuthProvider } from '@formly/core/schemas/common';
import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Notifications } from '@/app/ui/services/notifications';
import { getCognitoErrorNotification } from '@/app/core/auth/cognito-error-notifications';

@Component({
  selector: 'app-social-login-buttons',
  imports: [Button, TranslatePipe],
  templateUrl: './social-login-buttons.html',
})
export class SocialLoginButtons {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly notifications = inject(Notifications);
  readonly loadingProvider = signal<ExternalAuthProvider | null>(null);

  async signInWithProvider(provider: ExternalAuthProvider): Promise<void> {
    if (this.loadingProvider()) {
      return;
    }

    this.loadingProvider.set(provider);
    try {
      await this.authApi.signInWithProvider(provider);
      await this.router.navigate(['/dashboard/forms']);
    } catch (error) {
      const notification = getCognitoErrorNotification(error);
      this.notifications.error(notification.summaryKey, notification.detailKey);
    } finally {
      this.loadingProvider.set(null);
    }
  }
}
