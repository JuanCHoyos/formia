import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { provideTranslateService } from '@ngx-translate/core';

import { AuthApi } from '@/app/core/auth/auth-api';
import { Notifications } from '@/app/ui/services/notifications';
import { deferred, query } from '@/testing/dom';

import { SocialLoginButtons } from './social-login-buttons';

describe('SocialLoginButtons', () => {
  const authApi = { signInWithProvider: vi.fn() };
  const notifications = { error: vi.fn() };
  let fixture: ComponentFixture<SocialLoginButtons>;
  let component: SocialLoginButtons;
  let router: Router;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      imports: [SocialLoginButtons],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: AuthApi, useValue: authApi },
        { provide: Notifications, useValue: notifications },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(SocialLoginButtons);
    component = fixture.componentInstance;
  });

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };
  const button = (element: HTMLElement, labelKey: string) =>
    query<HTMLButtonElement>(element, `button[aria-label="auth.socialLogin.${labelKey}"]`);

  it('signs in with the provider and goes to the dashboard', async () => {
    authApi.signInWithProvider.mockResolvedValue(undefined);

    await component.signInWithProvider('Google');

    expect(authApi.signInWithProvider).toHaveBeenCalledWith('Google');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/forms']);
    expect(component.loadingProvider()).toBeNull();
  });

  it('marks the provider as loading while the sign-in is in flight', async () => {
    const request = deferred();
    authApi.signInWithProvider.mockReturnValue(request.promise);

    const pending = component.signInWithProvider('Google');
    expect(component.loadingProvider()).toBe('Google');

    request.resolve();
    await pending;
    expect(component.loadingProvider()).toBeNull();
  });

  it('ignores clicks while another sign-in is in flight', async () => {
    const request = deferred();
    authApi.signInWithProvider.mockReturnValue(request.promise);

    const pending = component.signInWithProvider('Google');
    await component.signInWithProvider('Facebook');
    expect(authApi.signInWithProvider).toHaveBeenCalledOnce();

    request.resolve();
    await pending;
  });

  it('maps Cognito errors to a notification and clears the loading state', async () => {
    authApi.signInWithProvider.mockRejectedValue({ name: 'LimitExceededException' });

    await component.signInWithProvider('Google');

    expect(notifications.error).toHaveBeenCalledWith(
      'auth.cognitoErrors.title',
      'auth.cognitoErrors.tooManyRequests',
    );
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.loadingProvider()).toBeNull();
  });

  describe('template', () => {
    it('renders one enabled button per provider and no status message', async () => {
      const element = await render();

      expect(element.querySelectorAll('button')).toHaveLength(3);
      expect(button(element, 'google').disabled).toBe(false);
      expect(element.querySelector('[role="status"]')).toBeNull();
    });

    it.each([
      ['google', 'Google'],
      ['facebook', 'Facebook'],
    ] as const)('signs in with %s when its button is clicked', async (labelKey, provider) => {
      authApi.signInWithProvider.mockResolvedValue(undefined);
      const element = await render();

      button(element, labelKey).click();
      await fixture.whenStable();

      expect(authApi.signInWithProvider).toHaveBeenCalledWith(provider);
    });

    it('disables every button and announces the redirect while signing in', async () => {
      const request = deferred();
      authApi.signInWithProvider.mockReturnValue(request.promise);
      const element = await render();

      button(element, 'google').click();
      await render();

      element
        .querySelectorAll('button')
        .forEach((providerButton) => expect(providerButton.disabled).toBe(true));
      expect(query(element, '[role="status"]').textContent).toContain(
        'auth.socialLogin.redirecting',
      );

      request.resolve();
      await vi.waitFor(() => expect(component.loadingProvider()).toBeNull());
      await render();
      expect(element.querySelector('[role="status"]')).toBeNull();
    });
  });
});
