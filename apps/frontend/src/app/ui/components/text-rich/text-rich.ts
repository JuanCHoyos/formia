import { Component, computed, input } from '@angular/core';

import { sanitizeRichText } from '../../utils/rich-text.utils';

/** Displays HTML written by `app-text-editor`, with the same content styles. */
@Component({
  selector: 'app-text-rich',
  template: `<div class="text-editor-content" [innerHTML]="content()"></div>`,
  host: { class: 'block' },
})
export class TextRich {
  readonly html = input<string | null | undefined>('');
  protected readonly content = computed(() => sanitizeRichText(this.html()));
}
