import { inject, Service } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ulid } from 'ulid';

import type { FieldTypeName } from '../../../formly/config/config-types';
import type {
  AppFormlyFieldConfig,
  FormPageContainer,
} from '../../../formly/types/app-formly-field-config';

const createFieldIdentity = () => ({
  id: ulid(),
  key: ulid(),
});

const createDefaultOptions = (translate: TranslateService) => [
  {
    label: translate.instant('formBuilder.defaults.optionOne') as string,
    value: 'option-1',
  },
  {
    label: translate.instant('formBuilder.defaults.optionTwo') as string,
    value: 'option-2',
  },
];

const createTextFieldConfig = (label: string): AppFormlyFieldConfig => ({
  ...createFieldIdentity(),
  type: 'text',
  wrappers: ['form-field'],
  props: {
    label,
    description: '',
    placeholder: '',
    pattern: '',
    min: 0,
    max: 100,
    required: false,
    disabled: false,
  },
});

const createTextareaFieldConfig = (label: string): AppFormlyFieldConfig => ({
  ...createFieldIdentity(),
  type: 'textarea',
  wrappers: ['form-field'],
  props: {
    label,
    placeholder: '',
    description: '',
    autoResize: false,
    min: 0,
    max: 1000,
    required: false,
    disabled: false,
  },
});

const createCheckboxFieldConfig = (label: string): AppFormlyFieldConfig => ({
  ...createFieldIdentity(),
  type: 'checkbox',
  wrappers: ['form-field'],
  props: {
    label,
    description: '',
    required: false,
    disabled: false,
  },
});

const createDateFieldConfig = (label: string): AppFormlyFieldConfig => ({
  ...createFieldIdentity(),
  type: 'date',
  wrappers: ['form-field'],
  props: {
    label,
    description: '',
    selection: 'single',
    view: 'date',
    format: 'dd/MM/yy',
    hourFormat: '24',
    showButtonBar: false,
    showIcon: true,
    showTime: false,
    timeOnly: false,
    required: false,
    disabled: false,
    minDate: undefined,
    maxDate: undefined,
    numberOfMonths: 1,
  },
});

const createSelectFieldConfig = (
  label: string,
  translate: TranslateService,
): AppFormlyFieldConfig => ({
  ...createFieldIdentity(),
  type: 'select',
  wrappers: ['form-field'],
  props: {
    label,
    description: '',
    placeholder: '',
    options: createDefaultOptions(translate),
    multiple: false,
    showClear: false,
    filter: false,
    required: false,
    disabled: false,
  },
});

const createRadioFieldConfig = (
  label: string,
  translate: TranslateService,
): AppFormlyFieldConfig => ({
  ...createFieldIdentity(),
  type: 'radio',
  wrappers: ['form-field'],
  props: {
    label,
    description: '',
    options: createDefaultOptions(translate),
    required: false,
    disabled: false,
  },
});

const createMultiCheckboxFieldConfig = (
  label: string,
  translate: TranslateService,
): AppFormlyFieldConfig => ({
  ...createFieldIdentity(),
  type: 'multicheckbox',
  wrappers: ['form-field'],
  props: {
    label,
    description: '',
    options: createDefaultOptions(translate),
    required: false,
    disabled: false,
  },
});

const createMatrixFieldConfig = (
  label: string,
  translate: TranslateService,
): AppFormlyFieldConfig => ({
  ...createFieldIdentity(),
  type: 'matrix',
  wrappers: ['form-field'],
  props: {
    label,
    questions: createDefaultOptions(translate),
    answers: createDefaultOptions(translate),
    selectionMode: 'single',
    required: false,
    disabled: false,
    description: '',
  },
});

const createRadioImageFieldConfig = (label: string): AppFormlyFieldConfig => ({
  ...createFieldIdentity(),
  type: 'radio-image',
  wrappers: ['form-field'],
  props: {
    label,
    options: [],
    required: false,
    disabled: false,
    description: '',
  },
});

const createRatingFieldConfig = (label: string): AppFormlyFieldConfig => ({
  ...createFieldIdentity(),
  type: 'rating',
  wrappers: ['form-field'],
  props: {
    label,
    required: false,
    disabled: false,
    description: '',
    type: 'star',
    stars: 5,
    allowHalf: false,
    lowLabel: undefined,
    highLabel: undefined,
  },
});

const createHeadingFieldConfig = (label: string): AppFormlyFieldConfig => ({
  id: ulid(),
  type: 'heading',
  props: {
    text: label,
    level: 2,
    alignment: 'start',
    subheading: undefined,
  },
});

const createParagraphFieldConfig = (label: string): AppFormlyFieldConfig => ({
  id: ulid(),
  type: 'paragraph',
  props: {
    text: label,
  },
});

const createImageFieldConfig = (): AppFormlyFieldConfig => ({
  id: ulid(),
  type: 'image',
  props: {
    src: '',
    alt: '',
  },
});

const createAlertFieldConfig = (label: string): AppFormlyFieldConfig => ({
  id: ulid(),
  type: 'alert',
  props: {
    severity: 'info',
    text: label,
    variant: 'text',
    size: undefined,
    closable: false,
  },
});

const createDividerFieldConfig = (): AppFormlyFieldConfig => ({
  id: ulid(),
  type: 'divider',
  props: {
    align: 'center',
    layout: 'horizontal',
    text: undefined,
    type: 'solid',
  },
});

const createContainerFieldConfig = (label: string): AppFormlyFieldConfig => ({
  ...createFieldIdentity(),
  type: 'container-group',
  wrappers: ['form-field-container'],
  props: {
    label,
    cols: 1,
  },
  fieldGroup: [],
});

export const fieldConfigFactories = {
  text: createTextFieldConfig,
  textarea: createTextareaFieldConfig,
  checkbox: createCheckboxFieldConfig,
  date: createDateFieldConfig,
  select: createSelectFieldConfig,
  radio: createRadioFieldConfig,
  multicheckbox: createMultiCheckboxFieldConfig,
  matrix: createMatrixFieldConfig,
  'radio-image': createRadioImageFieldConfig,
  rating: createRatingFieldConfig,
  heading: createHeadingFieldConfig,
  paragraph: createParagraphFieldConfig,
  image: createImageFieldConfig,
  alert: createAlertFieldConfig,
  divider: createDividerFieldConfig,
  'container-group': createContainerFieldConfig,
} satisfies Record<
  FieldTypeName,
  (label: string, translate: TranslateService) => AppFormlyFieldConfig
>;

const FIELD_LABEL_KEYS: Record<FieldTypeName, string> = {
  text: 'fieldPalette.fields.shortText.label',
  textarea: 'fieldPalette.fields.longText.label',
  checkbox: 'fieldPalette.fields.checkbox.label',
  date: 'fieldPalette.fields.date.label',
  select: 'fieldPalette.fields.dropdown.label',
  radio: 'fieldPalette.fields.singleChoice.label',
  multicheckbox: 'fieldPalette.fields.multipleChoice.label',
  matrix: 'fieldPalette.fields.matrix.label',
  'radio-image': 'fieldPalette.fields.imageChoice.label',
  rating: 'fieldPalette.fields.rating.label',
  heading: 'fieldPalette.fields.heading.label',
  paragraph: 'fieldPalette.fields.paragraph.label',
  image: 'fieldPalette.fields.image.label',
  alert: 'fieldPalette.fields.alert.label',
  divider: 'fieldPalette.fields.divider.label',
  'container-group': 'fieldPalette.fields.container.label',
};

@Service()
export class FieldConfigFactory {
  private readonly translate = inject(TranslateService);

  createFormFieldConf(type: FieldTypeName, label?: string) {
    const fieldLabel = label ?? (this.translate.instant(FIELD_LABEL_KEYS[type]) as string);
    return fieldConfigFactories[type](fieldLabel, this.translate) as AppFormlyFieldConfig;
  }

  createFormPageContainer(label: string): FormPageContainer {
    return {
      id: ulid(),
      key: ulid(),
      type: 'container-group',
      props: {
        label,
        cols: 1,
      },
      fieldGroup: [],
    };
  }
}
