import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField, max, min, validate } from '@angular/forms/signals';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AccordionModule } from 'primeng/accordion';
import { InputTextModule } from 'primeng/inputtext';

import type { TextFieldProps } from '@/app/formly/types/field-types';

import { CommonFieldConfigForm } from '../common-field-config-form/common-field-config-form';

@Component({
  selector: 'app-text-field-config-form',
  templateUrl: './text-field-config-form.html',
  imports: [
    InputTextModule,
    AccordionModule,
    TranslatePipe,
    FormsModule,
    CommonFieldConfigForm,
    FormField,
  ],
})
export class TextFieldConfigForm implements OnInit {
  readonly textFieldProps = input.required<TextFieldProps>();
  private readonly translate = inject(TranslateService);
  readonly propsChange = output<TextFieldProps>();

  textFieldSettings = signal<TextFieldProps>({
    placeholder: '',
    pattern: '',
    description: '',
    disabled: false,
    label: '',
    max: Number.NaN,
    min: Number.NaN,
    required: false,
  });

  textFieldSettingsForm = form(this.textFieldSettings, (path) => {
    min(path.min, 0);
    max(path.min, 100);
    min(path.max, 0);
    max(path.max, 100);

    validate(path.max, ({ value, valueOf }) => {
      if (value() >= valueOf(path.min)) return null;
      return {
        kind: 'max',
        message: this.translate.instant('formBuilder.validation.maxMustBeGreaterThanMin'),
      };
    });
  });

  constructor() {
    effect(() => {
      if (this.textFieldSettingsForm().valid()) {
        this.propsChange.emit(this.textFieldSettings());
      }
    });
  }

  ngOnInit(): void {
    this.textFieldSettings.set(this.textFieldProps());
  }
}
