import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { provideTranslateService } from '@ngx-translate/core';

import { AuthApi } from '@/app/core/auth/auth-api';
import { Notifications } from '@/app/ui/services/notifications';
import { deferred, query, submitForm, typeInto } from '@/testing/dom';

import { ForgotPassword } from './forgot-password';

const validReset = {
  email: 'ada@example.com',
  code: '123456',
  password: 'Abcdef1!',
  confirmPassword: 'Abcdef1!',
};

describe('ForgotPassword', () => {
  const authApi = { forgotPassword: vi.fn(), confirmForgotPassword: vi.fn() };
  const notifications = { success: vi.fn(), error: vi.fn() };
  let fixture: ComponentFixture<ForgotPassword>;
  let component: ForgotPassword;
  let router: Router;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: AuthApi, useValue: authApi },
        { provide: Notifications, useValue: notifications },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
  });

  const requestCode = () => component.requestCode(new Event('submit'));
  const resetPassword = () => component.resetPassword(new Event('submit'));
  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };
  const expectInvalidFormNotification = () =>
    expect(notifications.error).toHaveBeenCalledWith(
      'auth.validation.invalidForm.title',
      'auth.validation.invalidForm.detail',
    );

  it('starts on step 1', () => {
    expect(component.step()).toBe(1);
  });

  describe('requestCode', () => {
    it.each(['', 'not-an-email'])('rejects the email "%s"', async (email) => {
      component.reset.set({ ...validReset, email });

      await requestCode();

      expectInvalidFormNotification();
      expect(authApi.forgotPassword).not.toHaveBeenCalled();
      expect(component.step()).toBe(1);
    });

    it('sends the code and moves to step 2', async () => {
      authApi.forgotPassword.mockResolvedValue({});
      component.reset.set(validReset);

      await requestCode();

      expect(authApi.forgotPassword).toHaveBeenCalledWith({ email: 'ada@example.com' });
      expect(component.step()).toBe(2);
      expect(notifications.success).toHaveBeenCalledWith(
        'auth.notifications.resetCodeSent.title',
        'auth.notifications.resetCodeSent.detail',
      );
    });

    it('stays on step 1 and uses the passwordRecovery context on errors', async () => {
      authApi.forgotPassword.mockRejectedValue({ name: 'UserNotFoundException' });
      component.reset.set(validReset);

      await requestCode();

      expect(component.step()).toBe(1);
      expect(notifications.error).toHaveBeenCalledWith(
        'auth.cognitoErrors.title',
        'auth.cognitoErrors.passwordRecoveryFailed',
      );
      expect(component.isSubmitting()).toBe(false);
    });

    it('ignores a second request while one is in flight', async () => {
      const request = deferred();
      authApi.forgotPassword.mockReturnValue(request.promise);
      component.reset.set(validReset);

      const first = requestCode();
      await requestCode();
      expect(authApi.forgotPassword).toHaveBeenCalledOnce();

      request.resolve();
      await first;
    });
  });

  describe('resetPassword', () => {
    it.each([
      ['a short code', { code: '123' }],
      ['a password that breaks the policy', { password: 'weak', confirmPassword: 'weak' }],
      ['mismatching passwords', { confirmPassword: 'Different1!' }],
      ['an empty confirmation', { confirmPassword: '' }],
    ])('rejects %s', async (_case, override) => {
      component.reset.set({ ...validReset, ...override });

      await resetPassword();

      expectInvalidFormNotification();
      expect(authApi.confirmForgotPassword).not.toHaveBeenCalled();
    });

    it('resets the password and goes to login', async () => {
      authApi.confirmForgotPassword.mockResolvedValue({});
      component.reset.set(validReset);

      await resetPassword();

      expect(authApi.confirmForgotPassword).toHaveBeenCalledWith({
        email: 'ada@example.com',
        code: '123456',
        newPassword: 'Abcdef1!',
      });
      expect(notifications.success).toHaveBeenCalledWith(
        'auth.notifications.passwordReset.title',
        'auth.notifications.passwordReset.detail',
      );
      expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
    });

    it('maps Cognito errors and re-enables the form', async () => {
      authApi.confirmForgotPassword.mockRejectedValue({ name: 'CodeMismatchException' });
      component.reset.set(validReset);

      await resetPassword();

      expect(notifications.error).toHaveBeenCalledWith(
        'auth.cognitoErrors.title',
        'auth.cognitoErrors.codeMismatch',
      );
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
    });

    it('ignores a second reset while one is in flight', async () => {
      const request = deferred();
      authApi.confirmForgotPassword.mockReturnValue(request.promise);
      component.reset.set(validReset);

      const first = resetPassword();
      await resetPassword();
      expect(authApi.confirmForgotPassword).toHaveBeenCalledOnce();

      request.resolve();
      await first;
    });
  });

  describe('template', () => {
    it('renders the email step with the login link', async () => {
      const element = await render();

      expect(element.textContent).toContain('auth.forgotPassword.description');
      expect(element.querySelector('#email')).not.toBeNull();
      expect(element.querySelector('p-inputotp')).toBeNull();
      expect(query(element, 'a[href="/auth/login"]').textContent).toContain(
        'auth.forgotPassword.loginLink',
      );
    });

    it('binds the email and requests the code through the form', async () => {
      const request = deferred();
      authApi.forgotPassword.mockReturnValue(request.promise);
      const element = await render();
      const submitButton = query<HTMLButtonElement>(element, 'button[type="submit"]');
      expect(submitButton.disabled).toBe(true);

      typeInto(query<HTMLInputElement>(element, '#email'), 'ada@example.com');
      await render();
      expect(component.reset().email).toBe('ada@example.com');
      expect(submitButton.disabled).toBe(false);

      submitForm(element);
      const requesting = await render();
      expect(requesting.textContent).toContain('auth.forgotPassword.requesting');

      request.resolve();
      await fixture.whenStable();
    });

    it('renders the reset step and submits through the form', async () => {
      const request = deferred();
      authApi.confirmForgotPassword.mockReturnValue(request.promise);
      component.step.set(2);
      component.reset.set(validReset);
      const element = await render();

      expect(element.textContent).toContain('auth.forgotPassword.resetDescription');
      expect(element.querySelector('p-inputotp')).not.toBeNull();
      expect(element.querySelector('#email')).toBeNull();
      expect(element.textContent).toContain('auth.forgotPassword.resetSubmit');

      submitForm(element);
      const resetting = await render();

      expect(authApi.confirmForgotPassword).toHaveBeenCalledOnce();
      expect(resetting.textContent).toContain('auth.forgotPassword.resetting');

      request.resolve();
      await fixture.whenStable();
    });
  });
});
