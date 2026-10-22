import { Component } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import type { ParagraphFieldTypeConfig } from '../../interfaces/field-types/paragraph-field';
import { TextRich } from '@/app/ui/components/text-rich/text-rich';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'formly-field-paragraph',
  templateUrl: './paragraph-field.type.html',
  imports: [CommonModule, TextRich],
})
export class ParagraphFieldType extends FieldType<ParagraphFieldTypeConfig> {}
