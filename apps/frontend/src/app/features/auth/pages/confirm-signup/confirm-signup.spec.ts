import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter, Router } from '@angular/router';
import { AuthApi } from '@/app/core/auth/auth-api';
import { Notifications } from '@/app/ui/services/notifications';
import { deferred, query, submitForm } from '@/testing/dom';
import { ConfirmSignup } from './confirm-signup';

describe('ConfirmSignup', () => {
  const authApi = { confirmSignUpWithEmail: vi.fn() };
  const notifications = { success: vi.fn(), error: vi.fn() };
  let fixture: ComponentFixture<ConfirmSignup>;
  let component: ConfirmSignup;
  let router: Router;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      imports: [ConfirmSignup],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: AuthApi, useValue: authApi },
        { provide: Notifications, useValue: notifications },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(ConfirmSignup);
    fixture.componentRef.setInput('email', 'ada@example.com');
    component = fixture.componentInstance;
  });

  const submit = () => component.submit(new Event('submit'));
  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it.each(['', '123'])('rejects the incomplete code "%s"', async (code) => {
    component.code.set(code);

    await submit();

    expect(notifications.error).toHaveBeenCalledWith(
      'auth.validation.invalidForm.title',
      'auth.validation.invalidForm.detail',
    );
    expect(authApi.confirmSignUpWithEmail).not.toHaveBeenCalled();
  });

  it('confirms the account and goes to login', async () => {
    authApi.confirmSignUpWithEmail.mockResolvedValue({});
    component.code.set('123456');

    await submit();

    expect(authApi.confirmSignUpWithEmail).toHaveBeenCalledWith({ email: 'ada@example.com', code: '123456' });
    expect(notifications.success).toHaveBeenCalledWith(
      'auth.notifications.accountConfirmed.title',
      'auth.notifications.accountConfirmed.detail',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });

  it('uses the signUpConfirmation context for Cognito errors', async () => {
    authApi.confirmSignUpWithEmail.mockRejectedValue({
      name: 'NotAuthorizedException',
      message: 'User cannot be confirmed. Current status is CONFIRMED',
    });
    component.code.set('123456');

    await submit();

    expect(notifications.error).toHaveBeenCalledWith(
      'auth.cognitoErrors.title',
      'auth.cognitoErrors.alreadyConfirmed',
    );
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('ignores a second submit while one is in flight', async () => {
    const request = deferred();
    authApi.confirmSignUpWithEmail.mockReturnValue(request.promise);
    component.code.set('123456');

    const first = submit();
    await submit();
    expect(authApi.confirmSignUpWithEmail).toHaveBeenCalledOnce();

    request.resolve();
    await first;
  });

  describe('template', () => {
    it('renders the header, code input and login link', async () => {
      const element = await render();

      expect(element.textContent).toContain('auth.confirmSignup.title');
      expect(element.querySelector('p-inputotp')).not.toBeNull();
      expect(query(element, 'a[href="/auth/login"]').textContent).toContain('auth.confirmSignup.loginLink');
    });

    it('disables submit until the code is complete', async () => {
      const element = await render();
      const submitButton = query<HTMLButtonElement>(element, 'button[type="submit"]');
      expect(submitButton.disabled).toBe(true);

      component.code.set('123456');
      await render();

      expect(submitButton.disabled).toBe(false);
    });

    it('submits through the form and shows the submitting label while in flight', async () => {
      const request = deferred();
      authApi.confirmSignUpWithEmail.mockReturnValue(request.promise);
      component.code.set('123456');
      const element = await render();
      expect(element.textContent).toContain('auth.confirmSignup.submit');

      submitForm(element);
      const submitting = await render();

      expect(authApi.confirmSignUpWithEmail).toHaveBeenCalledOnce();
      expect(submitting.textContent).toContain('auth.confirmSignup.submitting');

      request.resolve();
      await fixture.whenStable();
    });
  });
});
