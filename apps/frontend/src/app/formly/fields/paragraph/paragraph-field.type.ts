import { Component } from '@angular/core';

import { FieldType } from '@ngx-formly/core';

import { TextRich } from '@/app/ui/components/text-rich/text-rich';

import type { ParagraphFieldTypeConfig } from '../../types/field-types/paragraph-field';

@Component({
  selector: 'formly-field-paragraph',
  templateUrl: './paragraph-field.type.html',
  imports: [TextRich],
})
export class ParagraphFieldType extends FieldType<ParagraphFieldTypeConfig> {}
