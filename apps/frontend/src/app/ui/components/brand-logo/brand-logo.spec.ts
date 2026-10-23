import { ComponentFixture, TestBed } from '@angular/core/testing';

import { query } from '@/testing/dom';

import { BrandLogo } from './brand-logo';

describe('BrandLogo', () => {
  let fixture: ComponentFixture<BrandLogo>;

  const render = (inputs: Partial<Record<'inverse' | 'wordmark', boolean>> = {}) => {
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(BrandLogo);
  });

  it('shows the brand mark on a brand background with the wordmark by default', () => {
    const element = render();

    expect(query(element, 'span[aria-hidden="true"]').classList).toContain('bg-brand');
    expect(query(element, 'path').getAttribute('fill')).toBe('#fff');
    expect(element.textContent).toContain('Pliego');
  });

  it('inverts the colors for dark surfaces', () => {
    const element = render({ inverse: true });
    const [sheet, fold, check] = Array.from(element.querySelectorAll('path'));

    expect(query(element, 'span[aria-hidden="true"]').classList).toContain('bg-white');
    expect(sheet.getAttribute('fill')).toBe('currentColor');
    expect(fold.getAttribute('stroke')).toBe('#fff');
    expect(check.getAttribute('stroke')).toBe('#fff');
  });

  it('hides the wordmark when only the mark is wanted', () => {
    const element = render({ wordmark: false });

    expect(element.textContent).not.toContain('Pliego');
  });
});
