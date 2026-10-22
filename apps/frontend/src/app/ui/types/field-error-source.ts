import type { Signal } from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';

export interface FieldErrorSource {
  readonly touched: Signal<boolean>;
  readonly errors: Signal<readonly ValidationError[]>;
}
