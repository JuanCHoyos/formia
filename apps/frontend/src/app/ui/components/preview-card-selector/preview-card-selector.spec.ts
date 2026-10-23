import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import type { OptionSelection } from '../../types/option-selection';
import type { PreviewCardSelectorOption } from '../../types/preview-card-selector-option';
import { PreviewCardSelector } from './preview-card-selector';
import { PreviewCardTemplate } from './preview-card-template';

const OPTIONS: PreviewCardSelectorOption[] = [
  { value: 'light', label: 'Light', icon: 'lucideSun' },
  { value: 'dark', label: 'Dark' },
];

@Component({
  imports: [PreviewCardSelector, PreviewCardTemplate],
  template: `
    <app-preview-card-selector
      [options]="options"
      [(value)]="value"
      [disabled]="disabled()"
      [stretch]="stretch()"
      [minItemWidth]="minItemWidth()"
      ariaLabel="Theme"
      (selectionChange)="selections.push($event)"
      (touch)="touches = touches + 1"
    >
      @if (withPreview()) {
        <ng-template [appPreviewCard]="options" let-option>
          <span class="preview">{{ option.value }}</span>
        </ng-template>
      }
    </app-preview-card-selector>
  `,
})
class Host {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>(undefined);
  readonly disabled = signal(false);
  readonly stretch = signal(false);
  readonly minItemWidth = signal('8rem');
  readonly withPreview = signal(true);
  readonly selections: OptionSelection<string>[] = [];
  touches = 0;
}

describe('PreviewCardSelector', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const render = () => {
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const inputs = () => Array.from<HTMLInputElement>(render().querySelectorAll('input'));
  const grid = () => render().querySelector<HTMLElement>('[role="radiogroup"]');

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
  });

  it('renders a labelled radio group with the projected preview for each option', () => {
    const element = render();

    expect(grid()?.getAttribute('aria-label')).toBe('Theme');
    expect(
      Array.from(element.querySelectorAll('.preview')).map((preview) => preview.textContent),
    ).toEqual(['light', 'dark']);
    expect(element.textContent).toContain('Dark');
    expect(element.querySelectorAll('ng-icon')).toHaveLength(1);
  });

  it('omits the preview area when no template is projected', () => {
    host.withPreview.set(false);

    expect(render().querySelector('.aspect-video')).toBeNull();
  });

  it('selects an option and reports the value, the card element and the touch', () => {
    inputs()[1].click();

    expect(host.value()).toBe('dark');
    expect(host.touches).toBe(1);
    expect(host.selections).toHaveLength(1);
    expect(host.selections[0].value).toBe('dark');
    expect(host.selections[0].element.tagName).toBe('LABEL');
    expect(inputs().map((input) => input.checked)).toEqual([false, true]);
  });

  it('fills the row with fixed-width cards, or stretches them to fit', () => {
    expect(grid()?.style.gridTemplateColumns).toBe(
      'repeat(auto-fill, minmax(min(100%, 8rem), 1fr))',
    );

    host.stretch.set(true);
    host.minItemWidth.set('10rem');
    expect(grid()?.style.gridTemplateColumns).toBe(
      'repeat(auto-fit, minmax(min(100%, 10rem), 1fr))',
    );
  });

  it('disables every card when disabled', () => {
    host.disabled.set(true);

    expect(inputs().every((input) => input.disabled)).toBe(true);
    expect(
      fixture.debugElement.query(By.directive(PreviewCardSelector)).componentInstance.disabled(),
    ).toBe(true);
  });
  it('finds the preview template and types its context through the guard', () => {
    render();
    const selector: PreviewCardSelector<string> = fixture.debugElement.query(
      By.directive(PreviewCardSelector),
    ).componentInstance;
    const template = selector['preview']();

    expect(template).toBeInstanceOf(PreviewCardTemplate);
    expect(template?.options()).toBe(OPTIONS);
    expect(
      template && PreviewCardTemplate.ngTemplateContextGuard(template, { $implicit: OPTIONS[0] }),
    ).toBe(true);
  });
});
