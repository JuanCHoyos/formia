import { DestroyRef, Directive, ElementRef, inject, output, signal } from '@angular/core';

@Directive({
  selector: '[appHoverState]',
  standalone: true,
  host: {
    '[attr.data-hover-state]': 'true',
    '(pointerover)': 'onPointerOver($event)',
    '(pointerleave)': 'onPointerLeave($event)',
  },
})
export class HoverTrigger {
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  private readonly isDirectlyHovered = signal(false);
  private hoverResetTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly hovered = output<boolean>();

  private isClosestHoverHost(element: Element): boolean {
    return element.closest('[data-hover-state]') === this.hostElement.nativeElement;
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearHoverResetTimeout();
    });
  }

  onPointerOver(event: PointerEvent): void {
    this.clearHoverResetTimeout();
    const target = event.target;

    if (!(target instanceof Element)) {
      this.setHovered(false);
      return;
    }

    this.setHovered(this.isClosestHoverHost(target));
  }

  onPointerLeave(event: PointerEvent): void {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Element && this.isClosestHoverHost(relatedTarget)) {
      return;
    }

    this.clearHoverResetTimeout();

    this.hoverResetTimeoutId = setTimeout(() => {
      this.setHovered(false);
      this.hoverResetTimeoutId = null;
    }, 80);
  }

  private setHovered(value: boolean): void {
    if (this.isDirectlyHovered() === value) return;

    this.isDirectlyHovered.set(value);
    this.hovered.emit(value);
  }

  private clearHoverResetTimeout(): void {
    if (this.hoverResetTimeoutId === null) return;

    clearTimeout(this.hoverResetTimeoutId);
    this.hoverResetTimeoutId = null;
  }
}
