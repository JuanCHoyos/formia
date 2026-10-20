import { computed, Injectable, OnDestroy, signal } from '@angular/core';
import type { AbstractControl } from '@angular/forms';
import type { Subscription } from 'rxjs';

@Injectable()
export class FormStepNavigation implements OnDestroy {
  readonly activeStep = signal<number>(0);

  private readonly stepValidity = signal<boolean[]>([]);
  private controls: readonly (AbstractControl | null | undefined)[] = [];
  private subscriptions: Subscription[] = [];

  readonly stepCount = signal<number>(0);
  readonly isLastStep = computed(
    () => this.stepCount() > 0 && this.activeStep() === this.stepCount() - 1,
  );

  readonly isFirstStep = computed(() => this.activeStep() === 0);

  readonly canProceedFromCurrent = computed(() => {
    const requiredCount = this.activeStep() + 1;
    const validity = this.stepValidity().slice(0, requiredCount);
    return validity.length === requiredCount && validity.every(Boolean);
  });

  initialize(controls: readonly (AbstractControl | null | undefined)[]): void {
    this.unsubscribeFromControls();
    this.controls = controls;
    this.stepCount.set(controls.length);
    this.activeStep.set(0);
    this.updateValidity();

    this.subscriptions = controls.flatMap((control) =>
      control ? [control.statusChanges.subscribe(() => this.updateValidity())] : [],
    );
  }

  canNavigateTo(stepIndex: number | string): boolean {
    const target = Number(stepIndex);
    if (!Number.isInteger(target) || target < 0 || target >= this.stepCount()) return false;
    if (target <= this.activeStep()) return true;

    const previousSteps = this.stepValidity().slice(0, target);
    return previousSteps.length === target && previousSteps.every(Boolean);
  }

  navigateTo(stepIndex: number | string | undefined): void {
    if (stepIndex === undefined) return;

    const target = Number(stepIndex);
    if (this.canNavigateTo(target)) this.activeStep.set(target);
  }

  previous(): void {
    this.navigateTo(this.activeStep() - 1);
  }

  next(): void {
    if (!this.canProceedFromCurrent()) return;
    this.navigateTo(this.activeStep() + 1);
  }

  ngOnDestroy(): void {
    this.unsubscribeFromControls();
  }

  private updateValidity(): void {
    this.stepValidity.set(this.controls.map((control) => control?.valid ?? false));
  }

  private unsubscribeFromControls(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = [];
  }
}
