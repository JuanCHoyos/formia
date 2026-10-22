import type { FormFieldConfiguration } from '../formly/interfaces/app-formly-field-config';

export interface FormTreeVersion {
  id: string;
  number: number;
  createdAt: Date;
  snapshot: FormFieldConfiguration;
}
