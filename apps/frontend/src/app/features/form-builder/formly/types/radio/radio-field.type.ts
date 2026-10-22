import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { FieldType } from '@ngx-formly/core';

import { RadioButtonModule } from 'primeng/radiobutton';

import type { RadioFieldTypeConfig } from '../../interfaces/field-types/radio-field';

@Component({
  selector: 'formly-field-radio',
  templateUrl: './radio-field.type.html',
  imports: [CommonModule, ReactiveFormsModule, RadioButtonModule, NgIcon],
  providers: [provideIcons({ lucideCheck })],
})
export class RadioFieldType extends FieldType<RadioFieldTypeConfig> {}
