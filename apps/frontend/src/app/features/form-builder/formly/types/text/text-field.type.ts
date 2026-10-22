import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType } from '@ngx-formly/core';
import { InputTextModule } from 'primeng/inputtext';
import type { TextFieldTypeConfig } from '../../interfaces/field-types/text-field';

@Component({
  selector: 'formly-field-text',
  templateUrl: './text-field.type.html',
  imports: [ReactiveFormsModule, InputTextModule],
})
export class TextFieldType extends FieldType<TextFieldTypeConfig> {}
