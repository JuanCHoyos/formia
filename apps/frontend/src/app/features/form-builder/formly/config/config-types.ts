import { ConfigOption } from '@ngx-formly/core';
import { AlertFieldType } from '../types/alert/alert-field.type';
import { CheckboxFieldType } from '../types/checkbox/checkbox-field.type';
import { DateFieldType } from '../types/date/date-field.type';
import { DividerFieldType } from '../types/divider/divider-field.type';
import { HeadingFieldType } from '../types/heading/heading-field.type';
import { ImageFieldType } from '../types/image/image-field.type';
import { MultiCheckboxFieldType } from '../types/multicheckbox/multicheckbox-field.type';
import { ParagraphFieldType } from '../types/paragraph/paragraph-field.type';
import { RadioFieldType } from '../types/radio/radio-field.type';
import { MatrixFieldType } from '../types/matrix/matrix-field.type';
import { RatingFieldType } from '../types/rating/rating-field.type';
import { SelectFieldType } from '../types/select/select-field.type';
import { TextFieldType } from '../types/text/text-field.type';
import { TextareaFieldType } from '../types/textarea/textarea-field.type';
import { RadioImageFieldType } from '../types/radio-image/radio-image-field.type';
import { ContainerGroupFieldType } from '../types/container-group/container-group-field.type';

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
