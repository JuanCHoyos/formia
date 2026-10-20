import { Component } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import type { ImageFieldTypeConfig } from '../../interfaces/field-types/image-field';

@Component({
  selector: 'formly-field-image',
  templateUrl: './image-field.type.html',
})
export class ImageFieldType extends FieldType<ImageFieldTypeConfig> {}
