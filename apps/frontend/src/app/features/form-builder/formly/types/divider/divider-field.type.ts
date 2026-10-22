import { Component } from '@angular/core';

import { FieldType } from '@ngx-formly/core';

import { DividerModule } from 'primeng/divider';

import type { DividerFieldTypeConfig } from '../../interfaces/field-types/divider-field';

@Component({
  selector: 'formly-field-divider',
  templateUrl: './divider-field.type.html',
  imports: [DividerModule],
})
export class DividerFieldType extends FieldType<DividerFieldTypeConfig> {}
