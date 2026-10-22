import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter, Router } from '@angular/router';
import type { SignInOutput } from 'aws-amplify/auth';
import { AuthApi } from '@/app/core/auth/auth-api';
import { Notifications } from '@/app/ui/services/notifications';
import { deferred, query, submitForm, typeInto } from '@/testing/dom';
import { Login } from './login';

const signedIn: SignInOutput = { isSignedIn: true, nextStep: { signInStep: 'DONE' } };

describe('Login', () => {
  const authApi = { signIn: vi.fn(), signInWithProvider: vi.fn() };
  const notifications = { success: vi.fn(), info: vi.fn(), error: vi.fn() };
  let fixture: ComponentFixture<Login>;
  let component: Login;
  let router: Router;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: AuthApi, useValue: authApi },
        { provide: Notifications, useValue: notifications },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
  });

  const submit = () => component.onSubmit(new Event('submit'));
  const fill = (email: string, password: string) => component.login.set({ email, password });
  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it('prevents the default form submission', async () => {
    const event = new Event('submit', { cancelable: true });

    await component.onSubmit(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it.each([
    ['empty fields', '', ''],
    ['an invalid email', 'not-an-email', 'Abcdef1!'],
    ['a missing password', 'ada@example.com', ''],
  ])('shows a validation error and does not sign in with %s', async (_case, email, password) => {
    fill(email, password);

    await submit();

    expect(notifications.error).toHaveBeenCalledWith(
      'auth.validation.invalidForm.title',
      'auth.validation.invalidForm.detail',
    );
    expect(authApi.signIn).not.toHaveBeenCalled();
  });

  it('signs in and goes to the dashboard', async () => {
    authApi.signIn.mockResolvedValue(signedIn);
    fill('ada@example.com', 'Abcdef1!');

    await submit();

    expect(authApi.signIn).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'Abcdef1!' });
    expect(notifications.success).toHaveBeenCalledWith(
      'auth.notifications.signedIn.title',
      'auth.notifications.signedIn.detail',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard/forms');
    expect(component.isSubmitting()).toBe(false);
  });

  it('redirects to confirm-signup when the account is not confirmed', async () => {
    authApi.signIn.mockResolvedValue({ isSignedIn: false, nextStep: { signInStep: 'CONFIRM_SIGN_UP' } });
    fill('ada@example.com', 'Abcdef1!');

    await submit();

    expect(notifications.info).toHaveBeenCalledWith(
      'auth.notifications.confirmationRequired.title',
      'auth.notifications.confirmationRequired.detail',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/confirm-signup/ada@example.com');
    expect(notifications.success).not.toHaveBeenCalled();
  });

  it('maps Cognito errors to a notification and re-enables the form', async () => {
    authApi.signIn.mockRejectedValue({ name: 'UserNotConfirmedException' });
    fill('ada@example.com', 'Abcdef1!');

    await submit();

    expect(notifications.error).toHaveBeenCalledWith(
      'auth.cognitoErrors.title',
      'auth.cognitoErrors.userNotConfirmed',
    );
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('ignores a second submit while one is in flight', async () => {
    const request = deferred<SignInOutput>();
    authApi.signIn.mockReturnValue(request.promise);
    fill('ada@example.com', 'Abcdef1!');

    const first = submit();
    await submit();
    expect(component.isSubmitting()).toBe(true);
    expect(authApi.signIn).toHaveBeenCalledOnce();

    request.resolve(signedIn);
    await first;
    expect(component.isSubmitting()).toBe(false);
  });

  describe('template', () => {
    it('renders the header, social buttons and navigation links', async () => {
      const element = await render();

      expect(element.textContent).toContain('auth.login.title');
      expect(element.querySelector('app-social-login-buttons')).not.toBeNull();
      expect(query(element, 'a[href="/auth/register"]').textContent).toContain('auth.login.registerLink');
      expect(query(element, 'a[href="/auth/forgot-password"]').textContent).toContain('auth.login.forgotPassword');
    });

    it('binds the email input and enables submit once the form is valid', async () => {
      const element = await render();
      const submitButton = query<HTMLButtonElement>(element, 'button[type="submit"]');
      expect(submitButton.disabled).toBe(true);

      typeInto(query<HTMLInputElement>(element, '#email'), 'ada@example.com');
      component.login.update((value) => ({ ...value, password: 'Abcdef1!' }));
      await render();

      expect(component.login().email).toBe('ada@example.com');
      expect(submitButton.disabled).toBe(false);
    });

    it('submits through the form and shows the submitting label while in flight', async () => {
      const request = deferred<SignInOutput>();
      authApi.signIn.mockReturnValue(request.promise);
      fill('ada@example.com', 'Abcdef1!');
      const element = await render();
      expect(element.textContent).toContain('auth.login.submit');

      submitForm(element);
      const submitting = await render();

      expect(authApi.signIn).toHaveBeenCalledOnce();
      expect(submitting.textContent).toContain('auth.login.submitting');

      request.resolve(signedIn);
      await fixture.whenStable();
    });
  });
});
