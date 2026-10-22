import { Component, effect, input, OnInit, output, signal } from '@angular/core';
import { form, FormField, min } from '@angular/forms/signals';

import { TranslatePipe } from '@ngx-translate/core';

import { AccordionModule } from 'primeng/accordion';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';

import type { ContainerFieldProps } from '@/app/features/form-builder/formly/interfaces/field-types';

@Component({
  selector: 'app-container-field-config-form',
  templateUrl: './container-field-config-form.html',
  imports: [AccordionModule, FormField, InputNumberModule, InputTextModule, TranslatePipe],
})
export class ContainerFieldConfigForm implements OnInit {
  readonly containerFieldProps = input.required<ContainerFieldProps>();
  readonly propsChange = output<ContainerFieldProps>();

  readonly containerFieldSettings = signal<ContainerFieldProps>({
    label: '',
    cols: 1,
  });

  readonly containerFieldSettingsForm = form(this.containerFieldSettings, (path) => {
    min(path.cols, 1);
  });

  constructor() {
    effect(() => {
      if (this.containerFieldSettingsForm().valid()) {
        this.propsChange.emit(this.containerFieldSettings());
      }
    });
  }

  ngOnInit(): void {
    this.containerFieldSettings.set(this.containerFieldProps());
  }
}
