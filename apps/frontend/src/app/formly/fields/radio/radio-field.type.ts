import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { FieldType } from '@ngx-formly/core';

import { RadioButtonModule } from 'primeng/radiobutton';

import type { RadioFieldTypeConfig } from '../../types/field-types/radio-field';

@Component({
  selector: 'formly-field-radio',
  templateUrl: './radio-field.type.html',
  imports: [ReactiveFormsModule, RadioButtonModule],
})
export class RadioFieldType extends FieldType<RadioFieldTypeConfig> {}
