import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, model, signal, viewChild } from '@angular/core';

import { Editor, NgxEditorComponent } from 'ngx-editor';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [CommonModule, NgxEditorComponent, FormsModule],
  selector: 'app-text-rich',
  templateUrl: './text-rich.html',
  styleUrls: ['./text-rich.scss'],
})
export class TextRich implements AfterViewInit {
  html = model<string>();
  ngxEditorInstance = viewChild<NgxEditorComponent>('ngxEditor');
  editor = signal<Editor>(
    new Editor({
      keyboardShortcuts: true,
    }),
  );

  ngAfterViewInit() {
    const ngxEditorInstance = this.ngxEditorInstance()?.editor();
    if (ngxEditorInstance) {
      ngxEditorInstance.view.dom.setAttribute('contenteditable', 'false');
    }
  }
}
