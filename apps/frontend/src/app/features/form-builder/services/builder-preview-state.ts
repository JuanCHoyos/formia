import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BuilderPreviewState {
  readonly isPreviewMode = signal(false);
  readonly previewIcon = computed(() => (this.isPreviewMode() ? 'lucidePencil' : 'lucideEye'));
  readonly previewText = computed(() =>
    this.isPreviewMode() ? 'formBuilder.header.backToEditor' : 'formBuilder.header.preview',
  );

  togglePreviewMode(): void {
    this.isPreviewMode.update((isPreviewMode) => !isPreviewMode);
  }
}
