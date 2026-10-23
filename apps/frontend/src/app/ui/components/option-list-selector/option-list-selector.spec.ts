import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionListSelector } from './option-list-selector';

const OPTIONS = [
  { label: 'Red', value: 'red' },
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
];

describe('OptionListSelector', () => {
  let fixture: ComponentFixture<OptionListSelector<string>>;
  let component: OptionListSelector<string>;
  let touches: number;

  const render = () => {
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const inputs = () => Array.from<HTMLInputElement>(render().querySelectorAll('input'));
  const choose = (index: number) => {
    const input = inputs()[index];
    input.click();
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(OptionListSelector<string>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('ariaLabel', 'Colors');
    touches = 0;
    component.touch.subscribe(() => touches++);
  });

  it('renders a labelled radio group with one row per option', () => {
    const element = render();
    const group = element.querySelector('[role="radiogroup"]');

    expect(group?.getAttribute('aria-label')).toBe('Colors');
    expect(inputs().map((input) => input.type)).toEqual(['radio', 'radio', 'radio']);
    expect(new Set(inputs().map((input) => input.name)).size).toBe(1);
    expect(element.textContent).toContain('Green');
  });

  it('keeps a single selected value in single mode', () => {
    choose(0);
    choose(2);

    expect(component.value()).toEqual(['blue']);
    expect(component.isSelected('blue')).toBe(true);
    expect(inputs().map((input) => input.checked)).toEqual([false, false, true]);
    expect(touches).toBe(2);
  });

  it('toggles values with checkboxes in multiple mode', () => {
    fixture.componentRef.setInput('multiple', true);
    const element = render();

    expect(element.querySelector('[role="group"]')).not.toBeNull();
    expect(inputs().every((input) => input.type === 'checkbox')).toBe(true);

    choose(0);
    choose(1);
    expect(component.value()).toEqual(['red', 'green']);

    choose(0);
    expect(component.value()).toEqual(['green']);
  });

  it('disables every option when disabled', () => {
    fixture.componentRef.setInput('disabled', true);

    expect(inputs().every((input) => input.disabled)).toBe(true);
  });
});
