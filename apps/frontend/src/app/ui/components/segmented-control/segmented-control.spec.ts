import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTranslateService } from '@ngx-translate/core';

import type { OptionSelection } from '../../types/option-selection';
import type { SegmentedControlOption } from '../../types/segmented-control-option';
import { SegmentedControl } from './segmented-control';

const OPTIONS: SegmentedControlOption<string>[] = [
  { value: 'all', labelKey: 'filters.all' },
  { value: 'draft', labelKey: 'filters.draft', icon: 'lucidePencil' },
];

describe('SegmentedControl', () => {
  let fixture: ComponentFixture<SegmentedControl<string>>;
  let component: SegmentedControl<string>;
  let selections: OptionSelection<string>[];

  const render = () => {
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const inputs = () => Array.from<HTMLInputElement>(render().querySelectorAll('input'));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(SegmentedControl<string>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', OPTIONS);
    selections = [];
    component.selectionChange.subscribe((selection) => selections.push(selection));
  });

  it('renders a radio group with translated labels and optional icons', () => {
    fixture.componentRef.setInput('ariaLabel', 'Status');
    fixture.componentRef.setInput('ariaLabelledBy', 'status-label');
    const element = render();
    const group = element.querySelector('[role="radiogroup"]');

    expect(group?.getAttribute('aria-label')).toBe('Status');
    expect(group?.getAttribute('aria-labelledby')).toBe('status-label');
    expect(element.textContent).toContain('filters.all');
    expect(element.querySelectorAll('ng-icon')).toHaveLength(1);
    expect(new Set(inputs().map((input) => input.name)).size).toBe(1);
  });

  it('checks the option matching the current value', () => {
    component.value.set('draft');

    expect(inputs().map((input) => input.checked)).toEqual([false, true]);
  });

  it('updates the value and reports the selected element', () => {
    inputs()[1].click();

    expect(component.value()).toBe('draft');
    expect(selections).toHaveLength(1);
    expect(selections[0].value).toBe('draft');
    expect(selections[0].element.tagName).toBe('LABEL');
  });

  it('stacks the icon above the label when asked', () => {
    fixture.componentRef.setInput('stacked', true);

    expect(render().querySelector('label')?.classList).toContain('flex-col');
  });
});
