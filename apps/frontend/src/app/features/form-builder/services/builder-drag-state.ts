import { Service, signal } from '@angular/core';

@Service()
export class BuilderDragState {
  readonly isDragging = signal(false);
}
