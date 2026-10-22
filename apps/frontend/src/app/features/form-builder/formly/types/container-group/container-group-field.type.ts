import { Component } from '@angular/core';
import { FieldType, FormlyField } from '@ngx-formly/core';
import { CommonModule } from '@angular/common';
import { ContainerFieldTypeConfig } from '../../interfaces/field-types/container-field';

@Component({
  selector: 'app-container-group-field-type',
  templateUrl: './container-group-field.type.html',
  imports: [CommonModule, FormlyField],
})
export class ContainerGroupFieldType extends FieldType<ContainerFieldTypeConfig> {}
