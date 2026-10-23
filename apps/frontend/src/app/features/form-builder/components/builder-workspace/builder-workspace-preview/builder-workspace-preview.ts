import { Component, computed, inject, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { FormlyForm } from '@ngx-formly/core';
import { TranslatePipe } from '@ngx-translate/core';

import { FormFieldConfigurationSchema } from '../../../../../formly/types/app-formly-field-config';
import { FormBuilderStore } from '../../../services/form-builder-store';

@Component({
  selector: 'app-builder-workspace-preview',
  templateUrl: './builder-workspace-preview.html',
  imports: [FormlyForm, ReactiveFormsModule, TranslatePipe],
})
export class BuilderWorkspacePreview {
  readonly formBuilderStore = inject(FormBuilderStore);

  fields = computed(() => FormFieldConfigurationSchema.parse(this.formBuilderStore.fields()));

  readonly form = new FormGroup({});
  readonly model: Record<string, unknown> = {};
  readonly submitted = signal(false);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.set(true);
  }
}
