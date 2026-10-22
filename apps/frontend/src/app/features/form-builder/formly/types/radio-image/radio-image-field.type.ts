import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { FieldType } from '@ngx-formly/core';

import { RadioButtonModule } from 'primeng/radiobutton';

import type { RadioImageFieldTypeConfig } from '../../interfaces/field-types/radio-image-field';

@Component({
  selector: 'formly-field-radio-image',
  templateUrl: './radio-image-field.type.html',
  imports: [ReactiveFormsModule, RadioButtonModule, NgIcon],
  providers: [provideIcons({ lucideCheck })],
})
export class RadioImageFieldType extends FieldType<RadioImageFieldTypeConfig> {}
