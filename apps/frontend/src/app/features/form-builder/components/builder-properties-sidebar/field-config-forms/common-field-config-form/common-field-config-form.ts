import { Component, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';

import { TranslatePipe } from '@ngx-translate/core';

import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { Checkbox } from '@/app/ui/components/checkbox/checkbox';

import type { CommonFieldConfigTree } from '../../../../types/field-config-settings';

@Component({
  selector: 'app-common-field-config-form',
  templateUrl: './common-field-config-form.html',
  imports: [
    FormField,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    TranslatePipe,
    Checkbox,
  ],
})
export class CommonFieldConfigForm {
  readonly commonFieldConfigForm = input.required<CommonFieldConfigTree>();
}
