import { Component } from '@angular/core';

import { FieldType } from '@ngx-formly/core';

import { OptionListSelector } from '@/app/ui/components/option-list-selector/option-list-selector';

import type { MultiCheckboxFieldTypeConfig } from '../../types/field-types/multicheckbox-field';

@Component({
  selector: 'formly-field-multicheckbox',
  templateUrl: './multicheckbox-field.type.html',
  imports: [OptionListSelector],
})
export class MultiCheckboxFieldType extends FieldType<MultiCheckboxFieldTypeConfig> {}
