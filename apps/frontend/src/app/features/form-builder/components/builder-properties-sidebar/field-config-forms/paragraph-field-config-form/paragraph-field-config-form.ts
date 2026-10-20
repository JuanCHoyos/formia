import { Component, effect, input, OnInit, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { AccordionModule } from 'primeng/accordion';
import { TextareaModule } from 'primeng/textarea';

import type {
  ParagraphFieldProps,
} from '@/app/features/form-builder/formly/interfaces/field-types';
import { TextEditor } from '@/app/ui/components/text-editor/text-editor';

@Component({
  selector: 'app-paragraph-field-config-form',
  templateUrl: './paragraph-field-config-form.html',
  imports: [AccordionModule, FormField, TextareaModule, TextEditor, TranslatePipe],
})
export class ParagraphFieldConfigForm implements OnInit {
  readonly paragraphFieldProps = input.required<ParagraphFieldProps>();
  readonly propsChange = output<ParagraphFieldProps>();

  readonly paragraphFieldSettings = signal<ParagraphFieldProps>({ text: '' });
  readonly paragraphFieldSettingsForm = form(this.paragraphFieldSettings);

  constructor() {
    effect(() => {
      if (this.paragraphFieldSettingsForm().valid()) {
        this.propsChange.emit(this.paragraphFieldSettings());
      }
    });
  }

  ngOnInit(): void {
    this.paragraphFieldSettings.set(this.paragraphFieldProps());
  }
}
