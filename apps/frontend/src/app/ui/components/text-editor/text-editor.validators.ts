import {
  MAX_LENGTH,
  maxLengthError,
  metadata,
  validate,
  type PathKind,
  type SchemaPath,
  type SchemaPathRules,
} from '@angular/forms/signals';

import { richTextLength } from '../../utils/rich-text.utils';

/**
 * Like `maxLength()`, but counts visible characters instead of the HTML string length. It also
 * sets `MAX_LENGTH`, so `[formField]` passes the limit to the editor and its counter.
 */
export const richTextMaxLength = <TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
  max: number,
): void => {
  metadata(path, MAX_LENGTH, () => max);
  validate(path, ({ value }) => (richTextLength(value()) > max ? maxLengthError(max) : undefined));
};
