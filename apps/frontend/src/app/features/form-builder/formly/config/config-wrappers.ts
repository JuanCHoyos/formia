import { ConfigOption } from '@ngx-formly/core';
import { FormFieldWrapper } from '../wrappers/form-field/form-field.wrapper';
import { FormScrollWrapper } from '../wrappers/form-scroll/scroll.wrapper';
import { FormStepsWrapper } from '../wrappers/form-steps/steps.wrapper';
import { FormTabsWrapper } from '../wrappers/form-tabs/tabs.wrapper';

export const fieldWrapperConfigurations = [
  { name: 'form-field', component: FormFieldWrapper },
  { name: 'form-steps', component: FormStepsWrapper },
  { name: 'form-scroll', component: FormScrollWrapper },
  { name: 'form-tabs', component: FormTabsWrapper },
] as const satisfies ConfigOption['wrappers'];

export type FieldWrapperName = (typeof fieldWrapperConfigurations)[number]['name'];
