import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { AccordionModule } from 'primeng/accordion';

import { CommonFieldConfigForm } from '../common-field-config-form/common-field-config-form';
import type { TextareaFieldProps } from '@/app/features/form-builder/formly/interfaces/field-types';
import { disabled, form, FormField, max, min, required, validate } from '@angular/forms/signals';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageModule } from 'primeng/message';
import { Checkbox } from '@/app/ui/components/checkbox/checkbox';

@Component({
  selector: 'app-textarea-field-config-form',
  templateUrl: './textarea-field-config-form.html',
  imports: [
    InputTextModule,
    InputNumberModule,
    AccordionModule,
    Checkbox,
    TranslatePipe,
    CommonFieldConfigForm,
    FormField,
    MessageModule,
  ],
})
export class TextareaFieldConfigForm implements OnInit {
  readonly textareaFieldProps = input.required<TextareaFieldProps>();
  readonly propsChange = output<TextareaFieldProps>();

  private readonly translate = inject(TranslateService);

  textareaFieldSettings = signal<TextareaFieldProps>({
    autoResize: false,
    placeholder: '',
    description: '',
    disabled: false,
    label: '',
    max: Number.NaN,
    min: Number.NaN,
    required: false,
  });

  textareaFieldSettingsForm = form(this.textareaFieldSettings, (path) => {
    min(path.min, 0);
    max(path.min, 1000);
    min(path.max, 0);
    max(path.max, 1000);

    validate(path.max, ({ value, valueOf }) => {
      if (value() >= valueOf(path.min)) {
        return null;
      }

      return {
        kind: 'max',
        message: this.translate.instant('formBuilder.validation.maxMustBeGreaterThanMin'),
      };
    });
  });

  constructor() {
    effect(() => {
      if (this.textareaFieldSettingsForm().valid()) {
        this.propsChange.emit(this.textareaFieldSettings());
      }
    });
  }

  ngOnInit(): void {
    this.textareaFieldSettings.set(this.textareaFieldProps());
  }
}
