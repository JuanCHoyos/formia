import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { FieldTree, FormField } from '@angular/forms/signals';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CommonModule } from '@angular/common';
import { BaseFieldProps } from '@/app/features/form-builder/formly/interfaces/field-types';
import { Checkbox } from '@/app/ui/components/checkbox/checkbox';

type CommonFieldConfigTree = Pick<
  FieldTree<BaseFieldProps, string | number, 'writable'>,
  keyof BaseFieldProps
>;

@Component({
  selector: 'app-common-field-config-form',
  templateUrl: './common-field-config-form.html',
  imports: [
    CommonModule,
    FormField,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    TranslatePipe,
    Checkbox
  ],
})
export class CommonFieldConfigForm {
  readonly commonFieldConfigForm = input.required<CommonFieldConfigTree>();
}
