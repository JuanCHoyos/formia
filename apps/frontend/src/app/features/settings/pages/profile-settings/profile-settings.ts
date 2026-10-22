import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { disabled, form, FormField, minLength, required } from '@angular/forms/signals';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';

import type { UserRole } from '@formly/core/schemas/common';
import type { UpdateUserProfileInput, UserProfile } from '@formly/core/schemas/user';

import { UserStore } from '@/app/core/auth/user-store';
import { UsersApi } from '@/app/core/users/users-api';
import { Button } from '@/app/ui/components/button/button';
import { OptionCardSelector } from '@/app/ui/components/option-card-selector/option-card-selector';
import { APP_ICONS } from '@/app/ui/constants/icons';
import { Notifications } from '@/app/ui/services/notifications';
import type { OptionCardSelectorOption } from '@/app/ui/types/option-card-selector-option';

import { SettingsSection } from '../../components/settings-section/settings-section';
import type { ProfileFormModel } from '../../types/profile-form-model';

const toFormModel = (user: UserProfile | null): ProfileFormModel => ({
  fullName: user?.fullName ?? '',
  roles: [...(user?.roles ?? [])],
});

const sameRoles = (a: readonly UserRole[], b: readonly UserRole[]) =>
  a.length === b.length && a.every((role) => b.includes(role));

@Component({
  selector: 'app-profile-settings',
  imports: [
    FormField,
    NgIcon,
    TranslatePipe,
    AvatarModule,
    InputTextModule,
    Button,
    OptionCardSelector,
    SettingsSection,
  ],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './profile-settings.html',
})
export class ProfileSettings {
  private readonly usersApi = inject(UsersApi);
  private readonly notifications = inject(Notifications);
  private readonly translate = inject(TranslateService);
  protected readonly userStore = inject(UserStore);

  protected readonly provider = computed(() => this.userStore.user()?.authProvider ?? 'SYSTEM');
  protected readonly isManagedByProvider = computed(() => this.provider() !== 'SYSTEM');

  protected readonly roleOptions: readonly OptionCardSelectorOption<UserRole>[] = [
    {
      icon: 'lucidePencilSparkles',
      label: this.translate.instant('roles.creator.label') as string,
      description: this.translate.instant('roles.creator.description') as string,
      value: 'FORM_CREATOR',
    },
    {
      icon: 'lucideClipboardPenLine',
      label: this.translate.instant('roles.respondent.label') as string,
      description: this.translate.instant('roles.respondent.description') as string,
      value: 'FORM_RESPONDENT',
    },
  ];

  protected readonly model = linkedSignal(() => toFormModel(this.userStore.user()));

  protected readonly profileForm = form(this.model, (path) => {
    required(path.fullName);
    disabled(path.fullName, () => this.isManagedByProvider());
    minLength(path.roles, 1);
  });

  protected readonly changes = computed<UpdateUserProfileInput>(() => {
    const user = this.userStore.user();
    const { fullName, roles } = this.model();
    const name = fullName.trim();

    return {
      ...(!this.isManagedByProvider() && name !== user?.fullName ? { fullName: name } : {}),
      ...(sameRoles(roles, user?.roles ?? []) ? {} : { roles }),
    };
  });

  protected readonly hasChanges = computed(() => Object.keys(this.changes()).length > 0);
  protected readonly isSaving = signal(false);
  protected readonly canSave = computed(
    () =>
      this.hasChanges() &&
      !this.isSaving() &&
      this.profileForm().valid() &&
      this.model().fullName.trim().length > 0,
  );

  protected discard(): void {
    this.model.set(toFormModel(this.userStore.user()));
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.canSave()) {
      return;
    }

    this.isSaving.set(true);
    try {
      this.userStore.set(await this.usersApi.updateProfile(this.changes()));
      this.notifications.success('settings.profile.saved.title', 'settings.profile.saved.detail');
    } catch {
      this.notifications.error('settings.profile.error.title', 'settings.profile.error.detail');
    } finally {
      this.isSaving.set(false);
    }
  }
}
