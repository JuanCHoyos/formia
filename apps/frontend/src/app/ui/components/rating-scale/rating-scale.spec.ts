import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatingScale } from './rating-scale';

describe('RatingScale', () => {
  let fixture: ComponentFixture<RatingScale>;
  let component: RatingScale;
  let touches: number;

  const buttons = () => {
    fixture.detectChanges();
    return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'));
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(RatingScale);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('count', 5);
    fixture.componentRef.setInput('ariaLabel', 'Satisfaction');
    touches = 0;
    component.touch.subscribe(() => touches++);
  });

  it('renders one numbered button per step inside a labelled group', () => {
    const steps = buttons();

    expect(steps.map((button) => button.textContent?.trim())).toEqual(['1', '2', '3', '4', '5']);
    expect(fixture.nativeElement.querySelector('[role="group"]').getAttribute('aria-label')).toBe(
      'Satisfaction',
    );
  });

  it('selects a step, highlights the steps up to it and marks it as pressed', () => {
    buttons()[2].click();
    const steps = buttons();

    expect(component.value()).toBe(3);
    expect(touches).toBe(1);
    expect(steps.map((button) => button.getAttribute('aria-pressed'))).toEqual([
      'false',
      'false',
      'true',
      'false',
      'false',
    ]);
    expect(steps.map((button) => button.classList.contains('p-button-outlined'))).toEqual([
      false,
      false,
      false,
      true,
      true,
    ]);
  });

  it('clears the value when the selected step is pressed again', () => {
    component.value.set(4);

    buttons()[3].click();

    expect(component.value()).toBeNull();
  });

  it('disables every step when disabled', () => {
    fixture.componentRef.setInput('disabled', true);

    expect(buttons().every((button) => button.disabled)).toBe(true);
  });
});
