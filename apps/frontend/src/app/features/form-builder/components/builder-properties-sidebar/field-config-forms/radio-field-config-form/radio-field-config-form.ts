import { Component, effect, input, OnInit, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

import { TranslatePipe } from '@ngx-translate/core';

import { AccordionModule } from 'primeng/accordion';

import type { RadioFieldProps } from '@/app/features/form-builder/formly/interfaces/field-types';
import { OptionEditor } from '@/app/ui/components/option-editor/option-editor';

import { CommonFieldConfigForm } from '../common-field-config-form/common-field-config-form';

@Component({
  selector: 'app-radio-field-config-form',
  templateUrl: './radio-field-config-form.html',
  imports: [AccordionModule, CommonFieldConfigForm, FormField, OptionEditor, TranslatePipe],
})
export class RadioFieldConfigForm implements OnInit {
  readonly radioFieldProps = input.required<RadioFieldProps>();
  readonly propsChange = output<RadioFieldProps>();

  readonly radioFieldSettings = signal<RadioFieldProps>({
    label: '',
    description: '',
    required: false,
    disabled: false,
    options: [],
  });

  readonly radioFieldSettingsForm = form(this.radioFieldSettings);

  constructor() {
    effect(() => {
      if (this.radioFieldSettingsForm().valid()) {
        this.propsChange.emit(this.radioFieldSettings());
      }
    });
  }

  ngOnInit(): void {
    this.radioFieldSettings.set(this.radioFieldProps());
  }
}
