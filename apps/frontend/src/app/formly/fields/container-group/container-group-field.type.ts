import { Component } from '@angular/core';

import { FieldType, FormlyField } from '@ngx-formly/core';

import { ContainerFieldTypeConfig } from '../../types/field-types/container-field';

@Component({
  selector: 'app-container-group-field-type',
  templateUrl: './container-group-field.type.html',
  imports: [FormlyField],
})
export class ContainerGroupFieldType extends FieldType<ContainerFieldTypeConfig> {}
