import { TestBed } from '@angular/core/testing';

import type { UserProfile } from '@formly/core/schemas/user';

import { Session } from './session';
import { UserStore } from './user-store';

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn().mockResolvedValue({
    tokens: { accessToken: { toString: () => 'access' }, idToken: { toString: () => 'id' } },
  }),
}));

const user: UserProfile = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  roles: ['FORM_CREATOR'],
  authProvider: 'SYSTEM',
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('Session.resolve', () => {
  const fetchMock = vi.fn<typeof fetch>();
  let session: Session;
  let userStore: UserStore;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    session = TestBed.inject(Session);
    userStore = TestBed.inject(UserStore);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('returns registered and stores the user on success', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: user }));

    await expect(session.resolve()).resolves.toBe('registered');
    expect(userStore.user()).toEqual(user);
  });

  it('returns unregistered and clears the store when the user does not exist yet', async () => {
    userStore.set(user);
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' }, 404),
    );

    await expect(session.resolve()).resolves.toBe('unregistered');
    expect(userStore.user()).toBeNull();
  });

  it('returns unauthenticated and clears the store on other API errors', async () => {
    userStore.set(user);
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401),
    );

    await expect(session.resolve()).resolves.toBe('unauthenticated');
    expect(userStore.user()).toBeNull();
  });

  it('returns unauthenticated when the request fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('network down'));

    await expect(session.resolve()).resolves.toBe('unauthenticated');
    expect(userStore.user()).toBeNull();
  });
});
