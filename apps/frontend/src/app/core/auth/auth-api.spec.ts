import { TestBed } from '@angular/core/testing';

import * as amplify from 'aws-amplify/auth';

import { AuthApi } from './auth-api';

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn().mockResolvedValue({
    tokens: { accessToken: { toString: () => 'access' }, idToken: { toString: () => 'id' } },
  }),
  signInWithRedirect: vi.fn(),
  signUp: vi.fn(),
  signIn: vi.fn(),
  confirmSignUp: vi.fn(),
  resetPassword: vi.fn(),
  confirmResetPassword: vi.fn(),
}));

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('AuthApi', () => {
  let api: AuthApi;

  beforeEach(() => {
    vi.clearAllMocks();
    api = TestBed.inject(AuthApi);
  });

  it('signs in with the email as username', async () => {
    vi.mocked(amplify.signIn).mockResolvedValue({
      isSignedIn: true,
      nextStep: { signInStep: 'DONE' },
    });

    await api.signIn({ email: 'ada@example.com', password: 'Abcdef1!' });

    expect(amplify.signIn).toHaveBeenCalledWith({
      username: 'ada@example.com',
      password: 'Abcdef1!',
    });
  });

  it('starts the OAuth redirect for a provider', async () => {
    await api.signInWithProvider('Google');

    expect(amplify.signInWithRedirect).toHaveBeenCalledWith({ provider: 'Google' });
  });

  it('rethrows provider sign-in errors', async () => {
    const error = new Error('popup closed');
    vi.mocked(amplify.signInWithRedirect).mockRejectedValue(error);

    await expect(api.signInWithProvider('Google')).rejects.toBe(error);
  });

  it('signs up with email and name attributes', async () => {
    await api.signUpWithEmail({
      email: 'ada@example.com',
      name: 'Ada',
      password: 'Abcdef1!',
      confirmPassword: 'Abcdef1!',
    });

    expect(amplify.signUp).toHaveBeenCalledWith({
      username: 'ada@example.com',
      password: 'Abcdef1!',
      options: { userAttributes: { email: 'ada@example.com', name: 'Ada' } },
    });
  });

  it('confirms the sign-up code', async () => {
    await api.confirmSignUpWithEmail({ email: 'ada@example.com', code: '123456' });

    expect(amplify.confirmSignUp).toHaveBeenCalledWith({
      username: 'ada@example.com',
      confirmationCode: '123456',
    });
  });

  it('requests a password reset', async () => {
    await api.forgotPassword({ email: 'ada@example.com' });

    expect(amplify.resetPassword).toHaveBeenCalledWith({ username: 'ada@example.com' });
  });

  it('confirms a password reset with the new password', async () => {
    await api.confirmForgotPassword({
      email: 'ada@example.com',
      code: '123456',
      newPassword: 'Abcdef1!',
    });

    expect(amplify.confirmResetPassword).toHaveBeenCalledWith({
      username: 'ada@example.com',
      confirmationCode: '123456',
      newPassword: 'Abcdef1!',
    });
  });

  describe('completeRegistration', () => {
    const input = { roles: ['FORM_CREATOR' as const], termsAccepted: true };
    const fetchMock = vi.fn<typeof fetch>();

    beforeEach(() => {
      fetchMock.mockReset();
      vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => vi.unstubAllGlobals());

    it('posts the input and returns the created profile', async () => {
      const profile = { fullName: 'Ada', email: 'ada@example.com', roles: input.roles };
      fetchMock.mockResolvedValue(jsonResponse({ success: true, data: profile }, 201));

      await expect(api.completeRegistration(input)).resolves.toEqual(profile);

      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toBe('POST');
      expect(new URL(request.url).pathname).toBe('/api/v1/users');
      expect(await request.json()).toEqual(input);
    });

    it('throws the API error message on failure', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          { success: false, code: 'USER_ALREADY_EXISTS', message: 'User already exists' },
          409,
        ),
      );

      await expect(api.completeRegistration(input)).rejects.toThrow('User already exists');
    });
  });
});
