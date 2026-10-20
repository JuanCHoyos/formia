import { Component, effect, input, OnInit, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { AccordionModule } from 'primeng/accordion';
import { InputTextModule } from 'primeng/inputtext';

import type { ImageFieldProps } from '@/app/features/form-builder/formly/interfaces/field-types';

@Component({
  selector: 'app-image-field-config-form',
  templateUrl: './image-field-config-form.html',
  imports: [AccordionModule, FormField, InputTextModule, TranslatePipe],
})
export class ImageFieldConfigForm implements OnInit {
  readonly imageFieldProps = input.required<ImageFieldProps>();
  readonly propsChange = output<ImageFieldProps>();

  readonly imageFieldSettings = signal<ImageFieldProps>({
    src: '',
    alt: '',
  });

  readonly imageFieldSettingsForm = form(this.imageFieldSettings);

  constructor() {
    effect(() => {
      if (this.imageFieldSettingsForm().valid()) {
        this.propsChange.emit(this.imageFieldSettings());
      }
    });
  }

  ngOnInit(): void {
    this.imageFieldSettings.set(this.imageFieldProps());
  }
}
