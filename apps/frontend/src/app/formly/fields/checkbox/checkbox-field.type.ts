import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { FieldType } from '@ngx-formly/core';

import { CheckboxModule } from 'primeng/checkbox';

import type { CheckboxFieldTypeConfig } from '../../types/field-types/checkbox-field';

@Component({
  selector: 'formly-field-checkbox',
  templateUrl: './checkbox-field.type.html',
  imports: [ReactiveFormsModule, CheckboxModule],
})
export class CheckboxFieldType extends FieldType<CheckboxFieldTypeConfig> {}
