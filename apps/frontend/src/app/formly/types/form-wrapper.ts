import type { FormlyFieldConfig } from '@ngx-formly/core';

export interface FormWrapperBaseProps {
  label: string;
}

export type FormScrollWrapperConfig = FormlyFieldConfig & {
  props: FormWrapperBaseProps;
};
export type FormTabsWrapperConfig = FormlyFieldConfig & {
  props: FormWrapperBaseProps;
};
export type FormStepsWrapperConfig = FormlyFieldConfig & {
  props: FormWrapperBaseProps;
};

export type FormContainerWrapperConfig<T> = FormlyFieldConfig & {
  wrapper: ['form-field-container'];
  key: string;
  fieldGroup: T[];
  props: {
    label: string;
    cols: number;
  };
};

export type FormWrapperConfig =
  FormScrollWrapperConfig | FormStepsWrapperConfig | FormTabsWrapperConfig;
