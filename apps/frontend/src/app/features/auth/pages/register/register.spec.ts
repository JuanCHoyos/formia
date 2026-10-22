import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter, Router } from '@angular/router';
import type { SignUpOutput } from 'aws-amplify/auth';
import { AuthApi } from '@/app/core/auth/auth-api';
import { Notifications } from '@/app/ui/services/notifications';
import { deferred, query, submitForm, typeInto } from '@/testing/dom';
import { Register } from './register';

const validInput = {
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  password: 'Abcdef1!',
  confirmPassword: 'Abcdef1!',
};

const signedUp: SignUpOutput = { isSignUpComplete: true, nextStep: { signUpStep: 'DONE' } };

describe('Register', () => {
  const authApi = { signUpWithEmail: vi.fn() };
  const notifications = { success: vi.fn(), error: vi.fn() };
  let fixture: ComponentFixture<Register>;
  let component: Register;
  let router: Router;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: AuthApi, useValue: authApi },
        { provide: Notifications, useValue: notifications },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
  });

  const submit = () => component.onSubmit(new Event('submit'));
  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it.each([
    ['an invalid email', { email: 'nope' }],
    ['a name shorter than 3 characters', { name: 'Al' }],
    ['a password that breaks the policy', { password: 'abc', confirmPassword: 'abc' }],
    ['mismatching passwords', { confirmPassword: 'Different1!' }],
    ['an empty email', { email: '' }],
  ])('rejects %s', async (_case, override) => {
    component.register.set({ ...validInput, ...override });

    await submit();

    expect(notifications.error).toHaveBeenCalledWith(
      'auth.validation.invalidForm.title',
      'auth.validation.invalidForm.detail',
    );
    expect(authApi.signUpWithEmail).not.toHaveBeenCalled();
  });

  it('goes to confirm-signup when Cognito asks for the code', async () => {
    authApi.signUpWithEmail.mockResolvedValue({ nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } });
    component.register.set(validInput);

    await submit();

    expect(authApi.signUpWithEmail).toHaveBeenCalledWith(validInput);
    expect(notifications.success).toHaveBeenCalledWith(
      'auth.notifications.confirmationCodeSent.title',
      'auth.notifications.confirmationCodeSent.detail',
    );
    expect(router.navigate).toHaveBeenCalledWith(['/auth/confirm-signup', 'ada@example.com']);
  });

  it('goes to login when no confirmation is needed', async () => {
    authApi.signUpWithEmail.mockResolvedValue(signedUp);
    component.register.set(validInput);

    await submit();

    expect(notifications.success).toHaveBeenCalledWith(
      'auth.notifications.accountCreated.title',
      'auth.notifications.accountCreated.detail',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });

  it('maps Cognito errors to a notification and re-enables the form', async () => {
    authApi.signUpWithEmail.mockRejectedValue({ name: 'UsernameExistsException' });
    component.register.set(validInput);

    await submit();

    expect(notifications.error).toHaveBeenCalledWith(
      'auth.cognitoErrors.title',
      'auth.cognitoErrors.emailAlreadyRegistered',
    );
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('ignores a second submit while one is in flight', async () => {
    const request = deferred<SignUpOutput>();
    authApi.signUpWithEmail.mockReturnValue(request.promise);
    component.register.set(validInput);

    const first = submit();
    await submit();
    expect(authApi.signUpWithEmail).toHaveBeenCalledOnce();

    request.resolve(signedUp);
    await first;
  });

  describe('template', () => {
    it('renders the header and the login link', async () => {
      const element = await render();

      expect(element.textContent).toContain('auth.register.title');
      expect(query(element, 'a[href="/auth/login"]').textContent).toContain(
        'auth.register.loginLink',
      );
    });

    it('binds the inputs and enables submit once the form is valid', async () => {
      const element = await render();
      const submitButton = query<HTMLButtonElement>(element, 'button[type="submit"]');
      expect(submitButton.disabled).toBe(true);

      typeInto(query<HTMLInputElement>(element, '#fullName'), validInput.name);
      typeInto(query<HTMLInputElement>(element, '#email'), validInput.email);
      component.register.update((value) => ({
        ...value,
        password: validInput.password,
        confirmPassword: validInput.confirmPassword,
      }));
      await render();

      expect(component.register()).toEqual(validInput);
      expect(submitButton.disabled).toBe(false);
    });

    it('submits through the form and shows the submitting label while in flight', async () => {
      const request = deferred<SignUpOutput>();
      authApi.signUpWithEmail.mockReturnValue(request.promise);
      component.register.set(validInput);
      const element = await render();
      expect(element.textContent).toContain('auth.register.submit');

      submitForm(element);
      const submitting = await render();

      expect(authApi.signUpWithEmail).toHaveBeenCalledOnce();
      expect(submitting.textContent).toContain('auth.register.submitting');

      request.resolve(signedUp);
      await fixture.whenStable();
    });
  });
});
