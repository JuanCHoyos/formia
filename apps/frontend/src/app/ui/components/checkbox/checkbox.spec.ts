import { ComponentFixture, TestBed } from '@angular/core/testing';

import { query } from '@/testing/dom';

import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  let fixture: ComponentFixture<Checkbox>;
  let component: Checkbox;
  let touches: number;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };
  const checkbox = async () => query<HTMLInputElement>(await render(), 'input[type="checkbox"]');

  beforeEach(() => {
    fixture = TestBed.createComponent(Checkbox);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Required');
    fixture.componentRef.setInput('inputId', 'required-field');
    touches = 0;
    component.touch.subscribe(() => touches++);
  });

  it('links the label to the checkbox and shows the description only when given', async () => {
    let element = await render();
    expect(query(element, 'label').getAttribute('for')).toBe('required-field');
    expect((await checkbox()).id).toBe('required-field');
    expect(element.textContent).toContain('Required');
    expect(element.querySelector('small')).toBeNull();

    fixture.componentRef.setInput('description', 'Respondents must answer');
    element = await render();
    expect(query(element, 'small').textContent).toContain('Respondents must answer');
  });

  it('toggles the checked value, highlights the row and marks it as touched', async () => {
    (await checkbox()).click();
    const element = await render();

    expect(component.checked()).toBe(true);
    expect(component.checkboxForm().touched()).toBe(true);
    expect(touches).toBeGreaterThan(0);
    expect(query(element, 'label').classList).toContain('bg-brand-soft');
  });

  it('reflects the checked value set from outside', async () => {
    component.checked.set(true);

    expect((await checkbox()).checked).toBe(true);
  });

  it('disables the checkbox and the form field when disabled', async () => {
    fixture.componentRef.setInput('disabled', true);
    const element = await render();

    expect((await checkbox()).disabled).toBe(true);
    expect(component.checkboxForm().disabled()).toBe(true);
    expect(query(element, 'label').classList).toContain('cursor-not-allowed');
  });

  it('emits touch when marked as touched directly', () => {
    component.markAsTouched();

    expect(touches).toBe(1);
    expect(component.checkboxForm().touched()).toBe(true);
  });
  it('marks the checkbox as touched when it loses focus', async () => {
    (await checkbox()).dispatchEvent(new Event('blur'));

    expect(touches).toBe(1);
  });
});
