import { Directive, ElementRef, effect, inject, input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appDragDropZone]',
  host: {
    class: 'border-2 border-dashed border-border-strong transition-colors',
    '(dragenter)': 'handleDragEnter($event)',
    '(dragover)': 'handleDragOver($event)',
    '(dragleave)': 'handleDragLeave($event)',
    '(drop)': 'handleDrop($event)',
  },
})
export class DragDropZoneDirective {
  readonly dragDropZoneEnabled = input(true);

  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private dragDepth = 0;
  private isActive = false;

  constructor() {
    effect(() => {
      if (!this.dragDropZoneEnabled()) {
        this.dragDepth = 0;
        this.setActive(false);
      }
    });
  }

  handleDragEnter(event: DragEvent): void {
    if (!this.dragDropZoneEnabled()) return;
    event.preventDefault();
    this.dragDepth++;
    this.setActive(true);
  }

  handleDragOver(event: DragEvent): void {
    if (!this.dragDropZoneEnabled()) return;
    event.preventDefault();
  }

  handleDragLeave(event: DragEvent): void {
    if (!this.dragDropZoneEnabled()) return;
    event.preventDefault();
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) this.setActive(false);
  }

  handleDrop(event: DragEvent): void {
    if (!this.dragDropZoneEnabled()) return;
    event.preventDefault();
    this.dragDepth = 0;
    this.setActive(false);
  }

  private setActive(isActive: boolean): void {
    if (this.isActive === isActive) return;
    this.isActive = isActive;

    if (isActive) {
      this.renderer.removeClass(this.element.nativeElement, 'border-border-strong');
      this.renderer.addClass(this.element.nativeElement, 'border-brand');
      this.renderer.addClass(this.element.nativeElement, 'bg-brand-soft');
      return;
    }

    this.renderer.removeClass(this.element.nativeElement, 'border-brand');
    this.renderer.removeClass(this.element.nativeElement, 'bg-brand-soft');
    this.renderer.addClass(this.element.nativeElement, 'border-border-strong');
  }
}
