import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { FieldType } from '@ngx-formly/core';

import { SelectModule } from 'primeng/select';

import type { SelectFieldTypeConfig } from '../../types/field-types/select-field';

@Component({
  selector: 'formly-field-select',
  templateUrl: './select-field.type.html',
  imports: [ReactiveFormsModule, SelectModule],
})
export class SelectFieldType extends FieldType<SelectFieldTypeConfig> {}
