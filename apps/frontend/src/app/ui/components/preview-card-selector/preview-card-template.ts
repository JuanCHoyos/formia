import { Directive, inject, input, TemplateRef } from '@angular/core';

import type {
  PreviewCardSelectorContext,
  PreviewCardSelectorOption,
} from '../../types/preview-card-selector-option';

/**
 * Marks the preview template of `app-preview-card-selector`. Passing the options types `let-option`:
 * `<ng-template [appPreviewCard]="options" let-option>`.
 */
@Directive({ selector: 'ng-template[appPreviewCard]' })
export class PreviewCardTemplate<O extends PreviewCardSelectorOption<unknown>> {
  readonly options = input.required<readonly O[]>({ alias: 'appPreviewCard' });
  readonly template = inject<TemplateRef<PreviewCardSelectorContext<O>>>(TemplateRef);

  static ngTemplateContextGuard<O extends PreviewCardSelectorOption<unknown>>(
    _directive: PreviewCardTemplate<O>,
    _context: unknown,
  ): _context is PreviewCardSelectorContext<O> {
    return true;
  }
}
