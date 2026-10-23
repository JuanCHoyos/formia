import type { FieldTree } from '@angular/forms/signals';

import type {
  AlertFieldProps,
  BaseFieldProps,
  DividerFieldProps,
  HeadingFieldProps,
} from '../../../formly/types/field-types';

export type AlertFieldSettings = Omit<AlertFieldProps, 'closable' | 'size'> & {
  size: 'default' | 'large' | 'small';
  closable: boolean;
};

export type CommonFieldConfigTree = Pick<
  FieldTree<BaseFieldProps, number | string, 'writable'>,
  keyof BaseFieldProps
>;

export type DividerFieldSettings = Omit<DividerFieldProps, 'text'> & { text: string };

export type HeadingFieldSettings = Omit<HeadingFieldProps, 'subheading'> & { subheading: string };

export type RatingFieldSettings = {
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
