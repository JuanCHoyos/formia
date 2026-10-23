import { Component } from '@angular/core';

import { FieldType } from '@ngx-formly/core';

import { OptionListSelector } from '@/app/ui/components/option-list-selector/option-list-selector';

import type { RadioFieldTypeConfig } from '../../types/field-types/radio-field';

@Component({
  selector: 'formly-field-radio',
  templateUrl: './radio-field.type.html',
  imports: [OptionListSelector],
})
export class RadioFieldType extends FieldType<RadioFieldTypeConfig> {
  protected get selectedValues(): string[] {
    const value: unknown = this.formControl.value;
    return typeof value === 'string' ? [value] : [];
  }
}
