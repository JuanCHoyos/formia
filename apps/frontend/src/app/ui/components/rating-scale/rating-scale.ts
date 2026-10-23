import { Component, computed, input, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-rating-scale',
  imports: [ButtonModule],
  templateUrl: './rating-scale.html',
})
export class RatingScale implements FormValueControl<number | null> {
  readonly count = input.required<number>();
  readonly value = model<number | null>(null);

  readonly disabled = input<boolean>(false);
  readonly ariaLabel = input<string>();
  readonly touch = output<void>();

  protected readonly steps = computed<number[]>(() =>
    Array.from({ length: this.count() }, (_, index) => index + 1),
  );

  protected select(step: number): void {
    this.touch.emit();
    this.value.set(step === this.value() ? null : step);
  }
}
