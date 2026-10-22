import { Component, effect, input, OnInit, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

import { TranslatePipe } from '@ngx-translate/core';

import { AccordionModule } from 'primeng/accordion';

import type { MultiCheckboxFieldProps } from '@/app/features/form-builder/formly/interfaces/field-types';
import { OptionEditor } from '@/app/ui/components/option-editor/option-editor';

import { CommonFieldConfigForm } from '../common-field-config-form/common-field-config-form';

@Component({
  selector: 'app-multicheckbox-field-config-form',
  templateUrl: './multicheckbox-field-config-form.html',
  imports: [AccordionModule, CommonFieldConfigForm, FormField, OptionEditor, TranslatePipe],
})
export class MultiCheckboxFieldConfigForm implements OnInit {
  readonly multicheckboxFieldProps = input.required<MultiCheckboxFieldProps>();
  readonly propsChange = output<MultiCheckboxFieldProps>();

  readonly multicheckboxFieldSettings = signal<MultiCheckboxFieldProps>({
    label: '',
    description: '',
    required: false,
    disabled: false,
    options: [],
  });

  readonly multicheckboxFieldSettingsForm = form(this.multicheckboxFieldSettings);

  constructor() {
    effect(() => {
      if (this.multicheckboxFieldSettingsForm().valid()) {
        this.propsChange.emit(this.multicheckboxFieldSettings());
      }
    });
  }

  ngOnInit(): void {
    this.multicheckboxFieldSettings.set(this.multicheckboxFieldProps());
  }
}
