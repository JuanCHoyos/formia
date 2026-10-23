import { Component, computed, signal } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { FieldWrapper } from '@ngx-formly/core';
import { TranslatePipe } from '@ngx-translate/core';

import { APP_ICONS } from '@/app/ui/constants/icons';

import type { FieldTypeName } from '../../config/config-types';
import type { FieldErrorMessage } from '../../types/field-error-message';
import type { FormWrapperConfig } from '../../types/form-wrapper';

@Component({
  selector: 'app-form-field-wrapper',
  templateUrl: './form-field.wrapper.html',
  imports: [NgIcon, TranslatePipe],
  providers: [provideIcons(APP_ICONS)],
})
export class FormFieldWrapper extends FieldWrapper<FormWrapperConfig> {
  inlineLabelFieldTypes = signal<FieldTypeName[]>(['checkbox']);

  hasInlineLabel = computed(() =>
    this.inlineLabelFieldTypes().includes(this.field.type as FieldTypeName),
  );

  errorMessage(): FieldErrorMessage | null {
    const { errors, touched, invalid } = this.formControl;
    if (!invalid || !touched || !errors) {
      return null;
    }

    if (errors['required']) {
      return { key: 'formly.errors.required' };
    }
    if (errors['minlength']) {
      return {
        key: 'formly.errors.minLength',
        params: { min: errors['minlength'].requiredLength },
      };
    }
    if (errors['maxlength']) {
      return {
        key: 'formly.errors.maxLength',
        params: { max: errors['maxlength'].requiredLength },
      };
    }
    return { key: 'formly.errors.invalid' };
  }
}
