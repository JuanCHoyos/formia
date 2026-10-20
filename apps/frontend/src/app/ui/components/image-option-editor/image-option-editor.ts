import type { RadioImageOption } from '@/app/features/form-builder/formly/interfaces/field-types';
import { Component, computed, input, model, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { form, FormField, disabled as disableField, FieldTree } from '@angular/forms/signals';
import { InputTextModule } from 'primeng/inputtext';
import { ulid } from 'ulid';
import { Button } from '../button/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { APP_ICONS } from '../../constants/icons';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { FileUploader } from '../file-uploader/file-uploader';
export type SelectOptionImage = RadioImageOption;

@Component({
  imports: [
    TranslatePipe,
    Button,
    InputTextModule,
    FormField,
    NgIcon,
    FileUploader,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
  ],
  selector: 'app-image-option-editor',
  templateUrl: './image-option-editor.html',

  providers: [provideIcons(APP_ICONS)],
})
export class ImageOptionEditor {
  readonly description = input<string>('');
  readonly required = input<boolean>(false);
  readonly inputId = input<string>(ulid());
  readonly sort = input<boolean>(false);

  readonly value = model<SelectOptionImage[]>([
    { label: '', value: '', image: '' },
  ]);
  readonly disabled = input<boolean>(false);
  readonly touch = output<void>();
  readonly gridTemplateColumns = computed(() =>
    this.sort()
      ? 'auto 1fr 1fr 1fr 28px'
      : '1fr 1fr 1fr auto',
  );

  readonly optionEditorForm = form(this.value, (path) => {
    disableField(path, { when: () => this.disabled() });
  });

  markAsTouched(): void {
    this.optionEditorForm().markAsTouched();
    this.touch.emit();
  }

  addOption(): void {
    this.value.update((options) => [...options, { label: '', value: '', image: '' }]);
  }

  removeOption(index: number): void {
    this.value.update((options) => options.filter((_, i) => i !== index));
  }

  drop(event: CdkDragDrop<FieldTree<SelectOptionImage[], string | number, 'writable'>>) {
    this.value.update((options) => {
      const updatedOptions = [...options];
      const [movedOption] = updatedOptions.splice(event.previousIndex, 1);

      updatedOptions.splice(event.currentIndex, 0, movedOption);

      return updatedOptions;
    });
  }
}
