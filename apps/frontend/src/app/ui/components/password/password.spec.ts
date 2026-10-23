import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTranslateService } from '@ngx-translate/core';

import { query, typeInto } from '@/testing/dom';

import { Password } from './password';

describe('Password', () => {
  let fixture: ComponentFixture<Password>;
  let component: Password;
  let touches: number;

  const render = () => {
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const input = () => query<HTMLInputElement>(render(), 'input');
  const toggle = () => query<HTMLButtonElement>(render(), 'button');
  const strength = () => render().querySelector(`#pwd-strength`);

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(Password);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('inputId', 'pwd');
    touches = 0;
    component.touch.subscribe(() => touches++);
  });

  it('renders a password input with the given attributes', () => {
    fixture.componentRef.setInput('placeholder', 'Your password');
    fixture.componentRef.setInput('autocomplete', 'current-password');
    fixture.componentRef.setInput('customClass', 'h-12');

    const field = input();

    expect(field.id).toBe('pwd');
    expect(field.type).toBe('password');
    expect(field.placeholder).toBe('Your password');
    expect(field.getAttribute('autocomplete')).toBe('current-password');
    expect(field.classList).toContain('h-12');
    expect(field.getAttribute('aria-describedby')).toBeNull();
  });

  it('writes what is typed to the value and emits touch on blur', () => {
    typeInto(input(), 'secret');
    input().dispatchEvent(new Event('blur'));

    expect(component.value()).toBe('secret');
    expect(touches).toBe(1);
  });

  it('ignores input events that do not come from an input element', () => {
    component['onInput'](new Event('input'));

    expect(component.value()).toBe('');
  });

  it('shows and hides the password with an accessible toggle', () => {
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
    expect(toggle().getAttribute('aria-label')).toBe('auth.password.show');
    expect(toggle().getAttribute('aria-controls')).toBe('pwd');

    toggle().click();
    expect(input().type).toBe('text');
    expect(toggle().getAttribute('aria-pressed')).toBe('true');
    expect(toggle().getAttribute('aria-label')).toBe('auth.password.hide');

    toggle().click();
    expect(input().type).toBe('password');
  });

  it('flags the input as invalid only once it is invalid and touched', () => {
    fixture.componentRef.setInput('invalid', true);
    expect(input().getAttribute('aria-invalid')).toBe('false');

    fixture.componentRef.setInput('touched', true);
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().classList).toContain('p-invalid');
  });

  it('disables the input and the toggle when disabled', () => {
    fixture.componentRef.setInput('disabled', true);

    expect(input().disabled).toBe(true);
    expect(toggle().disabled).toBe(true);
  });

  it('describes the input with the external hint and the strength meter', () => {
    fixture.componentRef.setInput('describedBy', 'pwd-hint');
    expect(input().getAttribute('aria-describedby')).toBe('pwd-hint');

    fixture.componentRef.setInput('showStrength', true);
    expect(input().getAttribute('aria-describedby')).toBe('pwd-hint pwd-strength');
  });

  it('hides the strength meter unless asked', () => {
    component.value.set('Abcdefg1!');

    expect(strength()).toBeNull();
  });

  describe('strength meter', () => {
    beforeEach(() => fixture.componentRef.setInput('showStrength', true));

    const filledBars = () =>
      Array.from(strength()?.querySelectorAll('span.h-1') ?? []).filter(
        (bar) => !bar.classList.contains('bg-viz-track'),
      ).length;

    it('shows the hint while the password is empty', () => {
      expect(strength()?.textContent).toContain('auth.passwordStrength.hint');
    });

    it.each([
      ['weak', 'abc', 1, 'bg-danger', 'auth.passwordStrength.rules.minLength'],
      ['fair', 'abcdefgh1', 2, 'bg-warn', 'auth.passwordStrength.rules.uppercase'],
      ['strong', 'Abcdefg1!', 3, 'bg-success', null],
      ['veryStrong', 'Abcdefghij1!', 4, 'bg-success', null],
    ])('rates %s passwords', (level, password, bars, barClass, missingRule) => {
      component.value.set(password);
      const meter = strength();

      expect(meter?.textContent).toContain(`auth.passwordStrength.levels.${level}`);
      expect(filledBars()).toBe(bars);
      expect(meter?.querySelector(`.${barClass}`)).not.toBeNull();
      if (missingRule) {
        expect(meter?.textContent).toContain(missingRule);
      } else {
        expect(meter?.textContent).not.toContain('auth.passwordStrength.rules');
      }
    });
  });
});
