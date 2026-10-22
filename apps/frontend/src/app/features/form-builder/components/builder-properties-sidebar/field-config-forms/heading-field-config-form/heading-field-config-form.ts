import { Component, effect, input, OnInit, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

import { TranslatePipe } from '@ngx-translate/core';

import { AccordionModule } from 'primeng/accordion';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import type { HeadingFieldProps } from '@/app/features/form-builder/formly/interfaces/field-types';
import { TextEditor } from '@/app/ui/components/text-editor/text-editor';

import type { HeadingFieldSettings } from '../../../../types/field-config-settings';
@Component({
  selector: 'app-heading-field-config-form',
  templateUrl: './heading-field-config-form.html',
  imports: [AccordionModule, FormField, InputTextModule, SelectModule, TranslatePipe, TextEditor],
})
export class HeadingFieldConfigForm implements OnInit {
  readonly headingFieldProps = input.required<HeadingFieldProps>();
  readonly propsChange = output<HeadingFieldProps>();

  readonly levelOptions = signal([
    { label: 'H1', value: 1 },
    { label: 'H2', value: 2 },
    { label: 'H3', value: 3 },
    { label: 'H4', value: 4 },
    { label: 'H5', value: 5 },
    { label: 'H6', value: 6 },
  ] satisfies { label: string; value: HeadingFieldProps['level'] }[]);

  readonly alignmentOptions = signal([
    { label: 'formBuilder.properties.heading.alignmentStart', value: 'start' },
    { label: 'formBuilder.properties.heading.alignmentCenter', value: 'center' },
    { label: 'formBuilder.properties.heading.alignmentEnd', value: 'end' },
  ] satisfies { label: string; value: HeadingFieldProps['alignment'] }[]);

  readonly headingFieldSettings = signal<HeadingFieldSettings>({
    text: '',
    level: 2,
    alignment: 'start',
    subheading: '',
  });

  readonly headingFieldSettingsForm = form(this.headingFieldSettings);

  constructor() {
    effect(() => {
      if (this.headingFieldSettingsForm().valid()) {
        const { subheading, ...props } = this.headingFieldSettings();
        this.propsChange.emit({
          ...props,
          ...(subheading ? { subheading } : {}),
        });
      }
    });
  }

  ngOnInit(): void {
    const props = this.headingFieldProps();
    this.headingFieldSettings.set({
      ...props,
      subheading: props.subheading ?? '',
    });
  }
}
