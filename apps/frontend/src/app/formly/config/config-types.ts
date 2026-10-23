import { ConfigOption } from '@ngx-formly/core';

import { AlertFieldType } from '../fields/alert/alert-field.type';
import { CheckboxFieldType } from '../fields/checkbox/checkbox-field.type';
import { ContainerGroupFieldType } from '../fields/container-group/container-group-field.type';
import { DateFieldType } from '../fields/date/date-field.type';
import { DividerFieldType } from '../fields/divider/divider-field.type';
import { HeadingFieldType } from '../fields/heading/heading-field.type';
import { ImageFieldType } from '../fields/image/image-field.type';
import { MatrixFieldType } from '../fields/matrix/matrix-field.type';
import { MultiCheckboxFieldType } from '../fields/multicheckbox/multicheckbox-field.type';
import { ParagraphFieldType } from '../fields/paragraph/paragraph-field.type';
import { RadioImageFieldType } from '../fields/radio-image/radio-image-field.type';
import { RadioFieldType } from '../fields/radio/radio-field.type';
import { RatingFieldType } from '../fields/rating/rating-field.type';
import { SelectFieldType } from '../fields/select/select-field.type';
import { TextFieldType } from '../fields/text/text-field.type';
import { TextareaFieldType } from '../fields/textarea/textarea-field.type';

export const fieldTypeConfigurations = [
  { name: 'text', component: TextFieldType, wrappers: ['form-field'] },
  { name: 'checkbox', component: CheckboxFieldType, wrappers: ['form-field'] },
  { name: 'container-group', component: ContainerGroupFieldType },
  { name: 'date', component: DateFieldType, wrappers: ['form-field'] },
  { name: 'textarea', component: TextareaFieldType, wrappers: ['form-field'] },
  { name: 'multicheckbox', component: MultiCheckboxFieldType, wrappers: ['form-field'] },
  { name: 'radio', component: RadioFieldType, wrappers: ['form-field'] },
  { name: 'matrix', component: MatrixFieldType, wrappers: ['form-field'] },
  { name: 'radio-image', component: RadioImageFieldType, wrappers: ['form-field'] },
  { name: 'select', component: SelectFieldType, wrappers: ['form-field'] },
  { name: 'rating', component: RatingFieldType, wrappers: ['form-field'] },
  { name: 'heading', component: HeadingFieldType },
  { name: 'alert', component: AlertFieldType },
  { name: 'divider', component: DividerFieldType },
  { name: 'image', component: ImageFieldType },
  { name: 'paragraph', component: ParagraphFieldType },
] as const satisfies ConfigOption['types'];

export type FieldTypeName = (typeof fieldTypeConfigurations)[number]['name'];
