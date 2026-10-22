import { Component, input, model, OnDestroy, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField, disabled as disableField } from '@angular/forms/signals';

import { TranslatePipe } from '@ngx-translate/core';

import { Editor, NgxEditorComponent, NgxEditorMenuComponent, Toolbar } from 'ngx-editor';
import { ulid } from 'ulid';

@Component({
  imports: [NgxEditorComponent, NgxEditorMenuComponent, FormField, FormsModule, TranslatePipe],
  selector: 'app-text-editor',
  templateUrl: './text-editor.html',
})
export class TextEditor implements OnDestroy {
  readonly required = input<boolean>(false);
  readonly inputId = input<string>(ulid());

  readonly value = model<string>('');
  readonly disabled = input<boolean>(false);
  readonly touch = output<void>();

  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['link'],
    ['ordered_list', 'bullet_list'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  colorPresets = ['red', '#FF0000', 'rgb(255, 0, 0)'];

  editor = signal<Editor>(
    new Editor({
      keyboardShortcuts: true,
    }),
  );

  readonly textEditorForm = form(this.value, (path) => {
    disableField(path, { when: () => this.disabled() });
  });

  ngOnDestroy(): void {
    this.editor().destroy();
  }

  markAsTouched(): void {
    this.textEditorForm().markAsTouched();
    this.touch.emit();
  }
}
