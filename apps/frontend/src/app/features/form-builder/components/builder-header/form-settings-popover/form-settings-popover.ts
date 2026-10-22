import { Component, inject } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

import { TranslatePipe } from '@ngx-translate/core';

import { InputNumberModule } from 'primeng/inputnumber';
import { PopoverModule } from 'primeng/popover';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { Button } from '@/app/ui/components/button/button';

import { FormBuilderStore } from '../../../services/form-builder-store';

const MIN_MULTIPLE_SUBMISSIONS = 2;

@Component({
  selector: 'app-form-settings-popover',
  templateUrl: './form-settings-popover.html',
  imports: [Button, FormField, InputNumberModule, PopoverModule, ToggleSwitchModule, TranslatePipe],
})
export class FormSettingsPopover {
  private readonly store = inject(FormBuilderStore);

  protected readonly settings = this.store.settings;
  protected readonly settingsForm = form(this.store.settings);
  protected readonly minMultipleSubmissions = MIN_MULTIPLE_SUBMISSIONS;

  /** Multiple submissions need a maximum above 1; a single submission always has a maximum of 1. */
  protected onAllowMultipleChange(allowed: boolean): void {
    this.store.settings.update((settings) => ({
      ...settings,
      maxSubmissionsPerUser: allowed
        ? Math.max(MIN_MULTIPLE_SUBMISSIONS, settings.maxSubmissionsPerUser)
        : 1,
    }));
  }
}
