import { Component, effect, input, OnInit, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

import { TranslatePipe } from '@ngx-translate/core';

import { AccordionModule } from 'primeng/accordion';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import type { AlertFieldProps } from '@/app/features/form-builder/formly/interfaces/field-types';
import { Checkbox } from '@/app/ui/components/checkbox/checkbox';

import type { AlertFieldSettings } from '../../../../types/field-config-settings';

@Component({
  selector: 'app-alert-field-config-form',
  templateUrl: './alert-field-config-form.html',
  imports: [AccordionModule, Checkbox, FormField, SelectModule, TextareaModule, TranslatePipe],
})
export class AlertFieldConfigForm implements OnInit {
  readonly alertFieldProps = input.required<AlertFieldProps>();
  readonly propsChange = output<AlertFieldProps>();

  readonly severityOptions = signal([
    { label: 'formBuilder.properties.alert.severity.success', value: 'success' },
    { label: 'formBuilder.properties.alert.severity.info', value: 'info' },
    { label: 'formBuilder.properties.alert.severity.warn', value: 'warn' },
    { label: 'formBuilder.properties.alert.severity.error', value: 'error' },
  ] satisfies { label: string; value: AlertFieldProps['severity'] }[]);

  readonly sizeOptions = signal([
    { label: 'formBuilder.properties.alert.size.default', value: 'default' },
    { label: 'formBuilder.properties.alert.size.small', value: 'small' },
    { label: 'formBuilder.properties.alert.size.large', value: 'large' },
  ] satisfies { label: string; value: AlertFieldSettings['size'] }[]);

  readonly variantOptions = signal([
    { label: 'formBuilder.properties.alert.variant.outlined', value: 'outlined' },
    { label: 'formBuilder.properties.alert.variant.text', value: 'text' },
    { label: 'formBuilder.properties.alert.variant.simple', value: 'simple' },
  ] satisfies { label: string; value: AlertFieldProps['variant'] }[]);

  readonly alertFieldSettings = signal<AlertFieldSettings>({
    text: '',
    severity: 'info',
    size: 'default',
    variant: 'text',
    closable: false,
  });

  readonly alertFieldSettingsForm = form(this.alertFieldSettings);

  constructor() {
    effect(() => {
      if (this.alertFieldSettingsForm().valid()) {
        const { size, ...settings } = this.alertFieldSettings();
        this.propsChange.emit({
          ...settings,
          ...(size === 'default' ? {} : { size }),
        });
      }
    });
  }

  ngOnInit(): void {
    const props = this.alertFieldProps();
    this.alertFieldSettings.set({
      ...props,
      size: props.size ?? 'default',
      closable: props.closable ?? false,
    });
  }
}
