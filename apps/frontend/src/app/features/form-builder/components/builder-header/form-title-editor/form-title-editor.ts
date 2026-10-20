import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { Button } from '@ui/components/button/button';
import { FormBuilderStore } from '../../../services/form-builder-store';

const MIN_TITLE_LENGTH = 3;

@Component({
  selector: 'app-form-title-editor',
  templateUrl: './form-title-editor.html',
  imports: [Button, InputTextModule, TranslatePipe],
})
export class FormTitleEditor {
  private readonly store = inject(FormBuilderStore);
  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  protected readonly title = this.store.title;
  protected readonly minTitleLength = MIN_TITLE_LENGTH;
  protected readonly editing = signal(false);
  protected readonly draft = signal('');
  protected readonly titleTooShort = computed(() => this.draft().trim().length < MIN_TITLE_LENGTH);

  protected startEditing(): void {
    this.draft.set(this.title());
    this.editing.set(true);
    queueMicrotask(() => {
      const input = this.titleInput()?.nativeElement;
      input?.focus();
      input?.select();
    });
  }

  protected cancel(): void {
    this.editing.set(false);
  }

  protected save(): void {
    if (this.titleTooShort()) {
      return;
    }

    this.store.title.set(this.draft().trim());
    this.editing.set(false);
  }
}
