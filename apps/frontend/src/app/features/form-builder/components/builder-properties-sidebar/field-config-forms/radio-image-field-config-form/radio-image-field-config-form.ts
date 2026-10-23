import { Component, effect, input, OnInit, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

import { TranslatePipe } from '@ngx-translate/core';

import { AccordionModule } from 'primeng/accordion';

import type { RadioImageFieldProps } from '@/app/formly/types/field-types';
import { ImageOptionEditor } from '@/app/ui/components/image-option-editor/image-option-editor';

import { CommonFieldConfigForm } from '../common-field-config-form/common-field-config-form';

@Component({
  selector: 'app-radio-image-field-config-form',
  templateUrl: './radio-image-field-config-form.html',
  imports: [AccordionModule, CommonFieldConfigForm, FormField, ImageOptionEditor, TranslatePipe],
})
export class RadioImageFieldConfigForm implements OnInit {
  readonly radioImageFieldProps = input.required<RadioImageFieldProps>();
  readonly propsChange = output<RadioImageFieldProps>();

  readonly radioImageFieldSettings = signal<RadioImageFieldProps>({
    label: '',
    description: '',
    required: false,
    disabled: false,
    options: [],
  });

  readonly radioImageFieldSettingsForm = form(this.radioImageFieldSettings);

  constructor() {
    effect(() => {
      if (this.radioImageFieldSettingsForm().valid()) {
        this.propsChange.emit(this.radioImageFieldSettings());
      }
    });
  }

  ngOnInit(): void {
    this.radioImageFieldSettings.set(this.radioImageFieldProps());
  }
}
