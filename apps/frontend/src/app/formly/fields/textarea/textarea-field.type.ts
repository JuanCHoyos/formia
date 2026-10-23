import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { FieldType } from '@ngx-formly/core';

import { TextareaModule } from 'primeng/textarea';

import type { TextareaFieldTypeConfig } from '../../types/field-types/textarea-field';

@Component({
  selector: 'formly-field-textarea',
  templateUrl: './textarea-field.type.html',
  imports: [ReactiveFormsModule, TextareaModule],
})
export class TextareaFieldType extends FieldType<TextareaFieldTypeConfig> {
  infinity = Infinity;
}
