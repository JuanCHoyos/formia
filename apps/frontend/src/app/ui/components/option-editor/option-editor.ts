import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, input, model, output } from '@angular/core';
import { form, FormField, disabled as disableField, FieldTree } from '@angular/forms/signals';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { InputTextModule } from 'primeng/inputtext';
import { ulid } from 'ulid';

import { APP_ICONS } from '../../constants/icons';
import { Button } from '../button/button';

export type SelectOption = { label: string; value: string };

@Component({
  imports: [
    CommonModule,
    TranslatePipe,
    Button,
    InputTextModule,
    FormField,
    NgIcon,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
  ],
  selector: 'app-option-editor',
  templateUrl: './option-editor.html',
  providers: [provideIcons(APP_ICONS)],
})
export class OptionEditor {
  readonly description = input<string>('');
  readonly required = input<boolean>(false);
  readonly inputId = input<string>(ulid());
  readonly sort = input<boolean>(false);

  readonly value = model<SelectOption[]>([{ label: '', value: '' }]);
  readonly disabled = input<boolean>(false);
  readonly touch = output<void>();

  readonly optionEditorForm = form(this.value, (path) => {
    disableField(path, { when: () => this.disabled() });
  });

  markAsTouched(): void {
    this.optionEditorForm().markAsTouched();
    this.touch.emit();
  }

  addOption(): void {
    this.value.update((options) => [...options, { label: '', value: '' }]);
  }

  removeOption(index: number): void {
    this.value.update((options) => options.filter((_, i) => i !== index));
  }

  drop(event: CdkDragDrop<FieldTree<SelectOption[], number | string, 'writable'>>) {
    this.value.update((options) => {
      const updatedOptions = [...options];
      const [movedOption] = updatedOptions.splice(event.previousIndex, 1);

      updatedOptions.splice(event.currentIndex, 0, movedOption);

      return updatedOptions;
    });
  }
}
