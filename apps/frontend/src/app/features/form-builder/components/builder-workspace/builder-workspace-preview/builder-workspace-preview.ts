import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { FormlyForm } from '@ngx-formly/core';
import { TranslatePipe } from '@ngx-translate/core';

import cloneDeep from 'lodash/cloneDeep';

import { FormBuilderStore } from '../../../services/form-builder-store';

@Component({
  selector: 'app-builder-workspace-preview',
  templateUrl: './builder-workspace-preview.html',
  imports: [CommonModule, FormlyForm, ReactiveFormsModule, TranslatePipe],
})
export class BuilderWorkspacePreview {
  readonly formBuilderStore = inject(FormBuilderStore);

  fields = computed(() => cloneDeep(this.formBuilderStore.fields()));

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
