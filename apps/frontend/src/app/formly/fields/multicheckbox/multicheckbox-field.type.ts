import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { FieldType } from '@ngx-formly/core';

import { CheckboxModule } from 'primeng/checkbox';

import type { MultiCheckboxFieldTypeConfig } from '../../types/field-types/multicheckbox-field';

@Component({
  selector: 'formly-field-multicheckbox',
  templateUrl: './multicheckbox-field.type.html',
  imports: [ReactiveFormsModule, CheckboxModule],
})
export class MultiCheckboxFieldType extends FieldType<MultiCheckboxFieldTypeConfig> {}
