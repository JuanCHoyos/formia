import { Component, effect, input, OnInit, output, signal } from '@angular/core';
import { form } from '@angular/forms/signals';

import { TranslatePipe } from '@ngx-translate/core';

import { AccordionModule } from 'primeng/accordion';

import type { CheckboxFieldProps } from '@/app/formly/types/field-types';

import { CommonFieldConfigForm } from '../common-field-config-form/common-field-config-form';

@Component({
  selector: 'app-checkbox-field-config-form',
  templateUrl: './checkbox-field-config-form.html',
  imports: [AccordionModule, TranslatePipe, CommonFieldConfigForm],
})
export class CheckboxFieldConfigForm implements OnInit {
  readonly checkboxFieldProps = input.required<CheckboxFieldProps>();
  readonly propsChange = output<CheckboxFieldProps>();

  checkboxFieldSettings = signal<CheckboxFieldProps>({
    description: '',
    disabled: false,
    label: '',
    required: false,
  });

  checkboxFieldSettingsForm = form(this.checkboxFieldSettings);

  constructor() {
    effect(() => {
      if (this.checkboxFieldSettingsForm().valid()) {
        this.propsChange.emit(this.checkboxFieldSettings());
      }
    });
  }

  ngOnInit(): void {
    this.checkboxFieldSettings.set(this.checkboxFieldProps());
  }
}
