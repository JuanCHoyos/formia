import { Component, effect, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField, validate } from '@angular/forms/signals';

import { TranslatePipe } from '@ngx-translate/core';

import { AccordionModule } from 'primeng/accordion';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

import type { SelectFieldProps } from '@/app/features/form-builder/formly/interfaces/field-types';
import { Checkbox } from '@/app/ui/components/checkbox/checkbox';
import { OptionEditor } from '@/app/ui/components/option-editor/option-editor';

import { CommonFieldConfigForm } from '../common-field-config-form/common-field-config-form';
@Component({
  selector: 'app-select-field-config-form',
  templateUrl: './select-field-config-form.html',
  imports: [
    FormsModule,
    InputTextModule,
    TranslatePipe,
    MessageModule,
    AccordionModule,
    CommonFieldConfigForm,
    FormField,
    OptionEditor,
    Checkbox,
  ],
})
export class SelectFieldConfigForm implements OnInit {
  readonly selectFieldProps = input.required<SelectFieldProps>();
  readonly propsChange = output<SelectFieldProps>();
  selectFieldSettings = signal<SelectFieldProps>({
    description: '',
    disabled: false,
    label: '',
    required: false,
    placeholder: '',
    options: [],
    multiple: false,
    showClear: false,
    filter: false,
  });

  selectFieldSettingsForm = form(this.selectFieldSettings, (path) => {
    validate(path.options, ({ value }) => {
      return value().every((option) => option.label.trim() !== '' && option.value.trim() !== '')
        ? null
        : {
            kind: 'required',
            message: 'Completa todos los campos',
          };
    });
  });

  constructor() {
    effect(() => {
      if (this.selectFieldSettingsForm().valid()) {
        this.propsChange.emit(this.selectFieldSettings());
      }
    });
  }

  ngOnInit(): void {
    this.selectFieldSettings.set(this.selectFieldProps());
  }
}
