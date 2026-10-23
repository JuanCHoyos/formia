import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { OptionCardSelectorOption } from '../../types/option-card-selector-option';
import { OptionCardSelector } from './option-card-selector';

const OPTIONS: OptionCardSelectorOption[] = [
  { icon: 'lucideUser', label: 'Creator', description: 'Builds forms', value: 'creator' },
  { icon: 'lucideInbox', label: 'Respondent', description: 'Answers forms', value: 'respondent' },
];

describe('OptionCardSelector', () => {
  let fixture: ComponentFixture<OptionCardSelector<string>>;
  let component: OptionCardSelector<string>;
  let touches: number;

  const render = () => {
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const inputs = () => Array.from<HTMLInputElement>(render().querySelectorAll('input'));

  beforeEach(() => {
    fixture = TestBed.createComponent(OptionCardSelector<string>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('ariaLabel', 'Roles');
    touches = 0;
    component.touch.subscribe(() => touches++);
  });

  it('renders a labelled group of cards with label and description', () => {
    const element = render();

    expect(element.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Roles');
    expect(element.textContent).toContain('Creator');
    expect(element.textContent).toContain('Answers forms');
    expect(inputs().map((input) => input.checked)).toEqual([false, false]);
  });

  it('adds and removes values as cards are toggled', () => {
    inputs()[0].click();
    inputs()[1].click();
    expect(component.value()).toEqual(['creator', 'respondent']);

    inputs()[0].click();
    expect(component.value()).toEqual(['respondent']);
    expect(component.isSelected('creator')).toBe(false);
    expect(touches).toBe(3);
  });

  it('reflects the value set from outside', () => {
    component.value.set(['respondent']);

    expect(inputs().map((input) => input.checked)).toEqual([false, true]);
  });

  it('disables every card when disabled', () => {
    fixture.componentRef.setInput('disabled', true);

    expect(inputs().every((input) => input.disabled)).toBe(true);
  });
});
