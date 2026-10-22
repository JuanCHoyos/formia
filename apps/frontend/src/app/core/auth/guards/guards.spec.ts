import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
  type UrlTree,
} from '@angular/router';

import { Session } from '../session';
import type { SessionStatus } from '../types/session-status';
import { authenticatedGuard } from './authenticated';
import { unauthenticatedGuard } from './unauthenticated';
import { unregisteredGuard } from './unregistered';

const route = {} as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

describe('auth guards', () => {
  let router: Router;
  const resolve = vi.fn<() => Promise<SessionStatus>>();

  beforeEach(() => {
    resolve.mockReset();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: Session, useValue: { resolve } }],
    });
    router = TestBed.inject(Router);
  });

  const run = async (guard: typeof authenticatedGuard, status: SessionStatus) => {
    resolve.mockResolvedValue(status);
    return TestBed.runInInjectionContext(() => guard(route, state));
  };

  const expectRedirect = (result: unknown, url: string) => {
    expect(router.serializeUrl(result as UrlTree)).toBe(url);
  };

  describe('authenticatedGuard', () => {
    it('allows registered users', async () => {
      expect(await run(authenticatedGuard, 'registered')).toBe(true);
    });

    it('sends unregistered users to complete-register', async () => {
      expectRedirect(await run(authenticatedGuard, 'unregistered'), '/complete-register');
    });

    it('sends unauthenticated users to login', async () => {
      expectRedirect(await run(authenticatedGuard, 'unauthenticated'), '/auth/login');
    });
  });

  describe('unauthenticatedGuard', () => {
    it('allows unauthenticated users', async () => {
      expect(await run(unauthenticatedGuard, 'unauthenticated')).toBe(true);
    });

    it('sends registered users to the dashboard', async () => {
      expectRedirect(await run(unauthenticatedGuard, 'registered'), '/dashboard/forms');
    });

    it('sends unregistered users to complete-register', async () => {
      expectRedirect(await run(unauthenticatedGuard, 'unregistered'), '/complete-register');
    });
  });

  describe('unregisteredGuard', () => {
    it('allows unregistered users', async () => {
      expect(await run(unregisteredGuard, 'unregistered')).toBe(true);
    });

    it('sends registered users to the dashboard', async () => {
      expectRedirect(await run(unregisteredGuard, 'registered'), '/dashboard/forms');
    });

    it('sends unauthenticated users to login', async () => {
      expectRedirect(await run(unregisteredGuard, 'unauthenticated'), '/auth/login');
    });
  });
});
