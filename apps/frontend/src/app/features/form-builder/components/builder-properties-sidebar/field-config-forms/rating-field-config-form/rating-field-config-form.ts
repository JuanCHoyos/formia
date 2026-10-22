import { Component, effect, input, OnInit, output, signal } from '@angular/core';
import { form, FormField, min } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { AccordionModule } from 'primeng/accordion';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { CommonFieldConfigForm } from '../common-field-config-form/common-field-config-form';
import { Checkbox } from '@/app/ui/components/checkbox/checkbox';
import type { RatingFieldProps } from '@/app/features/form-builder/formly/interfaces/field-types';

type RatingFieldSettings = {
  label: string;
  description: string;
  required: boolean;
  disabled: boolean;
  type: 'number' | 'star';
  stars: number;
  lowLabel: string;
  highLabel: string;
  allowHalf: boolean;
};

@Component({
  selector: 'app-rating-field-config-form',
  templateUrl: './rating-field-config-form.html',
  imports: [
    AccordionModule,
    Checkbox,
    CommonFieldConfigForm,
    FormField,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TranslatePipe,
  ],
})
export class RatingFieldConfigForm implements OnInit {
  readonly ratingFieldProps = input.required<RatingFieldProps>();
  readonly propsChange = output<RatingFieldProps>();

  readonly typeOptions = signal([
    { label: 'formBuilder.properties.rating.type.star', value: 'star' },
    { label: 'formBuilder.properties.rating.type.number', value: 'number' },
  ] satisfies { label: string; value: RatingFieldProps['type'] }[]);

  readonly ratingFieldSettings = signal<RatingFieldSettings>({
    label: '',
    description: '',
    required: false,
    disabled: false,
    type: 'star',
    stars: 5,
    lowLabel: '',
    highLabel: '',
    allowHalf: false,
  });

  readonly ratingFieldSettingsForm = form(this.ratingFieldSettings, (path) => {
    min(path.stars, 1);
  });

  constructor() {
    effect(() => {
      if (this.ratingFieldSettingsForm().valid()) {
        this.emitProps(this.ratingFieldSettings());
      }
    });
  }

  ngOnInit(): void {
    const props = this.ratingFieldProps();
    this.ratingFieldSettings.set({
      label: props.label,
      description: props.description,
      required: props.required,
      disabled: props.disabled,
      type: props.type,
      stars: props.stars,
      lowLabel: props.lowLabel ?? '',
      highLabel: props.highLabel ?? '',
      allowHalf: props.type === 'star' ? props.allowHalf : false,
    });
  }

  private emitProps(settings: RatingFieldSettings): void {
    const baseProps = {
      label: settings.label,
      description: settings.description,
      required: settings.required,
      disabled: settings.disabled,
      stars: settings.stars,
      ...(settings.lowLabel ? { lowLabel: settings.lowLabel } : {}),
      ...(settings.highLabel ? { highLabel: settings.highLabel } : {}),
    };

    switch (settings.type) {
      case 'star':
        this.propsChange.emit({
          ...baseProps,
          type: 'star',
          allowHalf: settings.allowHalf,
        });
        break;
      case 'number':
        this.propsChange.emit({ ...baseProps, type: 'number' });
        break;
    }
  }
}
