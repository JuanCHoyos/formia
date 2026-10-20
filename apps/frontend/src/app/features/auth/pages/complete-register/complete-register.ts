import { AuthHeader } from '@/app/features/auth/components/auth-header/auth-header';
import { AuthApi } from '@/app/core/auth/auth-api';
import { Button } from '@/app/ui/components/button/button';
import { OptionCardSelector } from '@/app/ui/components/option-card-selector/option-card-selector';
import { Notifications } from '@/app/ui/services/notifications';
import { Component, inject, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { UserStore } from '@/app/core/auth/user-store';
import type { UserRole } from '@formly/core/schemas/common';
import { CheckboxModule } from 'primeng/checkbox';
import type { OptionCardSelectorOption } from '@/app/ui/types/option-card-selector-option';

@Component({
  selector: 'app-complete-register',
  imports: [FormField, Button, CheckboxModule, AuthHeader, OptionCardSelector],
  templateUrl: './complete-register.html',
})
export class CompleteRegister {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly notifications = inject(Notifications);
  private readonly userStore = inject(UserStore);

  readonly roleOptions = signal<OptionCardSelectorOption<UserRole>[]>([
    {
      icon: 'lucidePencilSparkles',
      label: 'Crear formularios',
      description: 'Diseña formularios para recopilar respuestas.',
      value: 'FORM_CREATOR',
    },
    {
      icon: 'lucideClipboardPenLine',
      label: 'Responder formularios',
      description: 'Contesta un formulario compartido contigo.',
      value: 'FORM_RESPONDENT',
    },
  ]);

  userRegistration = signal<{ roles: UserRole[], terms: boolean }>({ roles: [], terms: false });

  readonly registrationForm = form(this.userRegistration, (path) => {
    minLength(path.roles, 1)
    required(path.terms)
  });

  readonly isSubmitting = signal(false);

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) {
      return;
    }
    if (this.registrationForm().invalid()) {
      this.notifications.error(
        'auth.validation.invalidForm.title',
        'auth.validation.invalidForm.detail',
      );
      return;
    }

    this.isSubmitting.set(true);
    try {
      const user = await this.authApi.completeRegistration({
        roles: this.userRegistration().roles,
        termsAccepted: this.userRegistration().terms,
      });
      this.userStore.set(user);
      this.notifications.success(
        'auth.completeRegister.successTitle',
        'auth.completeRegister.success',
      );
      await this.router.navigateByUrl('/dashboard/forms');
    } catch {
      this.notifications.error(
        'auth.completeRegister.errorTitle',
        'auth.completeRegister.error',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
