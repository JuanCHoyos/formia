import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { ValidationError } from '@angular/forms/signals';

import { provideTranslateService } from '@ngx-translate/core';

import type { FieldErrorSource } from '../../types/field-error-source';
import { FieldError } from './field-error';

describe('FieldError', () => {
  let fixture: ComponentFixture<FieldError>;
  const touched = signal(false);
  const errors = signal<readonly ValidationError[]>([]);
  const state: FieldErrorSource = { touched, errors };

  const render = () => {
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    touched.set(false);
    errors.set([]);
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(FieldError);
    fixture.componentRef.setInput('state', state);
    fixture.componentRef.setInput('id', 'email-error');
  });

  it('stays hidden until the field is touched', () => {
    errors.set([{ kind: 'required', message: 'validation.required' }]);

    expect(render().querySelector('p')).toBeNull();
  });

  it('shows the first error that has a message once touched', () => {
    touched.set(true);
    errors.set([{ kind: 'custom' }, { kind: 'required', message: 'validation.required' }]);

    const message = render().querySelector('p');

    expect(message?.id).toBe('email-error');
    expect(message?.textContent).toContain('validation.required');
  });

  it('shows nothing when no error carries a message', () => {
    touched.set(true);
    errors.set([{ kind: 'custom' }]);

    expect(render().querySelector('p')).toBeNull();
  });
});
