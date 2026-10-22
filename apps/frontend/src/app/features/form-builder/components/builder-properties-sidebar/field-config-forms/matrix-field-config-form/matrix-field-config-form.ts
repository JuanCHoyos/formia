import { Component, effect, input, OnInit, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { AccordionModule } from 'primeng/accordion';
import { SelectModule } from 'primeng/select';

import { CommonFieldConfigForm } from '../common-field-config-form/common-field-config-form';
import type { MatrixFieldProps } from '@/app/features/form-builder/formly/interfaces/field-types';
import { OptionEditor } from '@/app/ui/components/option-editor/option-editor';

@Component({
  selector: 'app-matrix-field-config-form',
  templateUrl: './matrix-field-config-form.html',
  imports: [
    AccordionModule,
    CommonFieldConfigForm,
    FormField,
    OptionEditor,
    SelectModule,
    TranslatePipe,
  ],
})
export class MatrixFieldConfigForm implements OnInit {
  readonly matrixFieldProps = input.required<MatrixFieldProps>();
  readonly propsChange = output<MatrixFieldProps>();

  readonly selectionModeOptions = signal([
    { label: 'formBuilder.properties.matrix.selectionMode.single', value: 'single' },
    { label: 'formBuilder.properties.matrix.selectionMode.multiple', value: 'multiple' },
  ] satisfies { label: string; value: MatrixFieldProps['selectionMode'] }[]);

  readonly matrixFieldSettings = signal<MatrixFieldProps>({
    label: '',
    description: '',
    required: false,
    disabled: false,
    questions: [],
    answers: [],
    selectionMode: 'single',
  });

  readonly matrixFieldSettingsForm = form(this.matrixFieldSettings);

  constructor() {
    effect(() => {
      if (this.matrixFieldSettingsForm().valid()) {
        this.propsChange.emit(this.matrixFieldSettings());
      }
    });
  }

  ngOnInit(): void {
    this.matrixFieldSettings.set(this.matrixFieldProps());
  }
}
