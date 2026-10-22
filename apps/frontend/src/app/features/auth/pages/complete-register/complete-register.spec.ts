import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';

import { provideTranslateService } from '@ngx-translate/core';

import type { UserRole } from '@formly/core/schemas/common';
import type { UserProfile } from '@formly/core/schemas/user';

import { AuthApi } from '@/app/core/auth/auth-api';
import { UserStore } from '@/app/core/auth/user-store';
import { OptionCardSelector } from '@/app/ui/components/option-card-selector/option-card-selector';
import { Notifications } from '@/app/ui/services/notifications';
import { deferred, query, submitForm } from '@/testing/dom';

import { CompleteRegister } from './complete-register';

const profile: UserProfile = {
  fullName: 'Ada',
  email: 'ada@example.com',
  roles: ['FORM_CREATOR'],
  authProvider: 'SYSTEM',
};

describe('CompleteRegister', () => {
  const authApi = { completeRegistration: vi.fn() };
  const notifications = { success: vi.fn(), error: vi.fn() };
  let fixture: ComponentFixture<CompleteRegister>;
  let component: CompleteRegister;
  let userStore: UserStore;
  let router: Router;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      imports: [CompleteRegister],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: AuthApi, useValue: authApi },
        { provide: Notifications, useValue: notifications },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(CompleteRegister);
    component = fixture.componentInstance;
    userStore = TestBed.inject(UserStore);
  });

  const submit = () => component.submit(new Event('submit'));
  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it('offers the creator and respondent roles', () => {
    expect(component.roleOptions().map((option) => option.value)).toEqual([
      'FORM_CREATOR',
      'FORM_RESPONDENT',
    ]);
  });

  it.each([
    ['no role selected', { roles: [], terms: true }],
    ['terms not accepted', { roles: ['FORM_CREATOR' as const], terms: false }],
  ])('rejects %s', async (_case, value) => {
    component.userRegistration.set(value);

    await submit();

    expect(notifications.error).toHaveBeenCalledWith(
      'auth.validation.invalidForm.title',
      'auth.validation.invalidForm.detail',
    );
    expect(authApi.completeRegistration).not.toHaveBeenCalled();
  });

  it('registers the user, stores the profile and goes to the dashboard', async () => {
    authApi.completeRegistration.mockResolvedValue(profile);
    component.userRegistration.set({ roles: ['FORM_CREATOR', 'FORM_RESPONDENT'], terms: true });

    await submit();

    expect(authApi.completeRegistration).toHaveBeenCalledWith({
      roles: ['FORM_CREATOR', 'FORM_RESPONDENT'],
      termsAccepted: true,
    });
    expect(userStore.user()).toEqual(profile);
    expect(notifications.success).toHaveBeenCalledWith(
      'auth.completeRegister.successTitle',
      'auth.completeRegister.success',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard/forms');
  });

  it('shows an error and keeps the store empty when registration fails', async () => {
    authApi.completeRegistration.mockRejectedValue(new Error('boom'));
    component.userRegistration.set({ roles: ['FORM_CREATOR'], terms: true });

    await submit();

    expect(notifications.error).toHaveBeenCalledWith(
      'auth.completeRegister.errorTitle',
      'auth.completeRegister.error',
    );
    expect(userStore.user()).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('ignores a second submit while one is in flight', async () => {
    const request = deferred<UserProfile>();
    authApi.completeRegistration.mockReturnValue(request.promise);
    component.userRegistration.set({ roles: ['FORM_CREATOR'], terms: true });

    const first = submit();
    await submit();
    expect(authApi.completeRegistration).toHaveBeenCalledOnce();

    request.resolve(profile);
    await first;
  });

  describe('template', () => {
    it('renders the role options and the terms checkbox', async () => {
      const element = await render();

      expect(element.querySelector('app-option-card-selector')).not.toBeNull();
      expect(element.querySelector('p-checkbox')).not.toBeNull();
      expect(query<HTMLButtonElement>(element, 'button[type="submit"]').disabled).toBe(true);
    });

    it('stores the roles picked in the selector', async () => {
      await render();
      const selector = fixture.debugElement.query(By.directive(OptionCardSelector));

      (selector.componentInstance as OptionCardSelector<UserRole>).toggleSelection(
        'FORM_RESPONDENT',
      );

      expect(component.userRegistration().roles).toEqual(['FORM_RESPONDENT']);
    });

    it('submits through the form once the form is valid', async () => {
      authApi.completeRegistration.mockResolvedValue(profile);
      component.userRegistration.set({ roles: ['FORM_CREATOR'], terms: true });
      const element = await render();
      expect(query<HTMLButtonElement>(element, 'button[type="submit"]').disabled).toBe(false);

      submitForm(element);
      await fixture.whenStable();

      expect(authApi.completeRegistration).toHaveBeenCalledOnce();
    });
  });
});
