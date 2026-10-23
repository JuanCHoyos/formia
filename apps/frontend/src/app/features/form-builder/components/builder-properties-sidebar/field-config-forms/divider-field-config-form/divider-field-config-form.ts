import { Component, computed, effect, input, OnInit, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

import { TranslatePipe } from '@ngx-translate/core';

import { AccordionModule } from 'primeng/accordion';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import type { DividerFieldProps } from '@/app/formly/types/field-types';

import type { DividerFieldSettings } from '../../../../types/field-config-settings';

@Component({
  selector: 'app-divider-field-config-form',
  templateUrl: './divider-field-config-form.html',
  imports: [AccordionModule, FormField, InputTextModule, SelectModule, TranslatePipe],
})
export class DividerFieldConfigForm implements OnInit {
  readonly dividerFieldProps = input.required<DividerFieldProps>();
  readonly propsChange = output<DividerFieldProps>();

  readonly layoutOptions = signal([
    { label: 'formBuilder.properties.divider.layout.horizontal', value: 'horizontal' },
    { label: 'formBuilder.properties.divider.layout.vertical', value: 'vertical' },
  ] satisfies { label: string; value: DividerFieldProps['layout'] }[]);

  readonly lineTypeOptions = signal([
    { label: 'formBuilder.properties.divider.lineType.solid', value: 'solid' },
    { label: 'formBuilder.properties.divider.lineType.dashed', value: 'dashed' },
    { label: 'formBuilder.properties.divider.lineType.dotted', value: 'dotted' },
  ] satisfies { label: string; value: DividerFieldProps['type'] }[]);

  readonly alignmentOptions = computed(() =>
    this.dividerFieldSettings().layout === 'horizontal'
      ? ([
          { label: 'formBuilder.properties.divider.alignment.left', value: 'left' },
          { label: 'formBuilder.properties.divider.alignment.center', value: 'center' },
          { label: 'formBuilder.properties.divider.alignment.right', value: 'right' },
        ] satisfies { label: string; value: DividerFieldProps['align'] }[])
      : ([
          { label: 'formBuilder.properties.divider.alignment.top', value: 'top' },
          { label: 'formBuilder.properties.divider.alignment.center', value: 'center' },
          { label: 'formBuilder.properties.divider.alignment.bottom', value: 'bottom' },
        ] satisfies { label: string; value: DividerFieldProps['align'] }[]),
  );

  readonly dividerFieldSettings = signal<DividerFieldSettings>({
    align: 'center',
    layout: 'horizontal',
    text: '',
    type: 'solid',
  });

  readonly dividerFieldSettingsForm = form(this.dividerFieldSettings);

  constructor() {
    effect(() => {
      if (this.dividerFieldSettingsForm().valid()) {
        const { text, ...props } = this.dividerFieldSettings();
        this.propsChange.emit({
          ...props,
          ...(text ? { text } : {}),
        });
      }
    });
  }

  ngOnInit(): void {
    const props = this.dividerFieldProps();
    this.dividerFieldSettings.set({
      ...props,
      text: props.text ?? '',
    });
  }

  onLayoutChange(layout: unknown): void {
    if (layout !== 'horizontal' && layout !== 'vertical') return;

    this.dividerFieldSettings.update((settings) => ({
      ...settings,
      layout,
      align: this.isAlignmentValid(layout, settings.align) ? settings.align : 'center',
    }));
  }

  private isAlignmentValid(
    layout: DividerFieldProps['layout'],
    alignment: DividerFieldProps['align'],
  ): boolean {
    return layout === 'horizontal'
      ? alignment === 'left' || alignment === 'center' || alignment === 'right'
      : alignment === 'top' || alignment === 'center' || alignment === 'bottom';
  }
}
