import { AUTH_ROUTES } from './auth.routes';

describe('AUTH_ROUTES', () => {
  it('redirects the empty path to login', () => {
    expect(AUTH_ROUTES[0]).toMatchObject({ path: '', redirectTo: 'login', pathMatch: 'full' });
  });

  it('declares the auth pages', () => {
    expect(AUTH_ROUTES.map((route) => route.path)).toEqual([
      '',
      'login',
      'register',
      'confirm-signup/:email',
      'forgot-password',
    ]);
  });

  it.each(['login', 'register', 'confirm-signup/:email', 'forgot-password'])(
    'lazy loads the component for %s',
    async (path) => {
      const route = AUTH_ROUTES.find((candidate) => candidate.path === path);
      const loaded = await (route?.loadComponent as () => Promise<unknown>)();

      expect(loaded).toBeTypeOf('function');
    },
    30_000,
  );
});
