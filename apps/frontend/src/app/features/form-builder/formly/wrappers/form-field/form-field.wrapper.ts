import { TranslatePipe } from '@ngx-translate/core';
import { Component, computed, signal } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';
import { CommonModule } from '@angular/common';
import type { FieldTypeName } from '../../config/config-types';
import type { FormWrapperConfig } from '../../interfaces/wrapper-types/form-wrapper';

@Component({
  selector: 'app-form-field-wrapper',
  templateUrl: './form-field.wrapper.html',
  imports: [CommonModule, TranslatePipe],
})
export class FormFieldWrapper extends FieldWrapper<FormWrapperConfig> {
  inlineLabelFieldTypes = signal<FieldTypeName[]>(['checkbox']);

  hasInlineLabel = computed(() =>
    this.inlineLabelFieldTypes().includes(this.field.type as FieldTypeName),
  );
}
