import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { FieldType } from '@ngx-formly/core';

import { CheckboxModule } from 'primeng/checkbox';

import type { MultiCheckboxFieldTypeConfig } from '../../interfaces/field-types/multicheckbox-field';

@Component({
  selector: 'formly-field-multicheckbox',
  templateUrl: './multicheckbox-field.type.html',
  imports: [CommonModule, ReactiveFormsModule, CheckboxModule, NgIcon],
  providers: [provideIcons({ lucideCheck })],
})
export class MultiCheckboxFieldType extends FieldType<MultiCheckboxFieldTypeConfig> {}
