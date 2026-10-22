import { Component } from '@angular/core';

import { FieldType } from '@ngx-formly/core';

import { TextRich } from '@/app/ui/components/text-rich/text-rich';

import type { HeadingFieldTypeConfig } from '../../interfaces/field-types/heading-field';

@Component({
  selector: 'formly-field-heading',
  templateUrl: './heading-field.type.html',
  imports: [TextRich],
})
export class HeadingFieldType extends FieldType<HeadingFieldTypeConfig> {}
