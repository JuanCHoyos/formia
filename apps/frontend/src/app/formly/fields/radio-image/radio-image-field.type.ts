import { Component } from '@angular/core';

import { FieldType } from '@ngx-formly/core';

import { PreviewCardSelector } from '@/app/ui/components/preview-card-selector/preview-card-selector';
import { PreviewCardTemplate } from '@/app/ui/components/preview-card-selector/preview-card-template';

import type { RadioImageFieldTypeConfig } from '../../types/field-types/radio-image-field';

@Component({
  selector: 'formly-field-radio-image',
  templateUrl: './radio-image-field.type.html',
  imports: [PreviewCardSelector, PreviewCardTemplate],
})
export class RadioImageFieldType extends FieldType<RadioImageFieldTypeConfig> {}
