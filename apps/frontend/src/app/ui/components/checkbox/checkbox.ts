import { CommonModule } from '@angular/common';
import { Component, input, model, output } from '@angular/core';
import { form, FormField, disabled as disableField } from '@angular/forms/signals';

import { CheckboxModule } from 'primeng/checkbox';
import { ulid } from 'ulid';

@Component({
  imports: [CommonModule, CheckboxModule, FormField],
  selector: 'app-checkbox',
  templateUrl: './checkbox.html',
})
export class Checkbox {
  readonly label = input.required<string>();
  readonly description = input<string>('');
  readonly required = input<boolean>(false);
  readonly inputId = input<string>(ulid());

  readonly checked = model<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly touch = output<void>();

  readonly checkboxForm = form(this.checked, (path) => {
    disableField(path, { when: () => this.disabled() });
  });

  markAsTouched(): void {
    this.checkboxForm().markAsTouched();
    this.touch.emit();
  }
}
