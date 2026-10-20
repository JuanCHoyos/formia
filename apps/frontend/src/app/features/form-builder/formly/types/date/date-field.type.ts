import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import type { DateFieldTypeConfig } from '../../interfaces/field-types/date-field';
import { FieldType } from '@ngx-formly/core';

@Component({
  selector: 'formly-field-date',
  templateUrl: './date-field.type.html',
  imports: [ReactiveFormsModule, DatePickerModule],
})
export class DateFieldType extends FieldType<DateFieldTypeConfig> {}
